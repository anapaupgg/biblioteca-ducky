-- =====================================================================
--  Biblioteca Ducky
--  02_reglas.sql · Funciones, triggers y vistas
-- =====================================================================
SET search_path TO biblioteca, public;

-- =====================================================================
--  FUNCIONES DE APOYO
-- =====================================================================

-- Suma N días hábiles (sin sábados ni domingos) a una fecha
CREATE OR REPLACE FUNCTION sumar_dias_habiles(p_fecha DATE, p_dias INTEGER)
RETURNS DATE LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_fecha DATE := p_fecha;
    v_restantes INTEGER := p_dias;
BEGIN
    WHILE v_restantes > 0 LOOP
        v_fecha := v_fecha + 1;
        IF EXTRACT(ISODOW FROM v_fecha) < 6 THEN      -- 1..5 = lunes a viernes
            v_restantes := v_restantes - 1;
        END IF;
    END LOOP;
    RETURN v_fecha;
END $$;

-- Minúsculas y sin acentos, para que la búsqueda ignore acentos
CREATE OR REPLACE FUNCTION unaccent_lower(p_texto TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT translate(lower(p_texto), 'áéíóúüñ', 'aeiouun');
$$;

-- ¿El perfil del usuario tiene la función?
CREATE OR REPLACE FUNCTION tiene_funcion(p_clave VARCHAR, p_funcion VARCHAR)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1
        FROM usuarios u
        JOIN perfiles p        ON p.id_perfil = u.id_perfil AND p.estatus = 'Activo'
        JOIN perfil_funcion pf ON pf.id_perfil = p.id_perfil
        JOIN funciones f       ON f.id_funcion = pf.id_funcion
        WHERE u.clave_usuario = p_clave
          AND u.estatus = 'Activo'
          AND f.nombre = p_funcion);
$$;

-- Usuario que está operando (app.usuario)
CREATE OR REPLACE FUNCTION usuario_actual()
RETURNS VARCHAR LANGUAGE sql STABLE AS $$
    SELECT u.clave_usuario FROM usuarios u
    WHERE u.clave_usuario = nullif(current_setting('app.usuario', true), '');
$$;

CREATE OR REPLACE FUNCTION registrar_bitacora(p_accion VARCHAR, p_detalle VARCHAR)
RETURNS VOID LANGUAGE sql AS $$
    INSERT INTO bitacora (clave_usuario, accion, detalle)
    VALUES (usuario_actual(), p_accion, left(p_detalle, 255));
$$;

-- =====================================================================
--  1. GESTIÓN DE USUARIOS Y PERFILES
-- =====================================================================

-- Un usuario solo puede asignarse a un perfil activo
CREATE OR REPLACE FUNCTION fn_usuarios_perfil_activo() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM perfiles WHERE id_perfil = NEW.id_perfil AND estatus = 'Activo') THEN
        RAISE EXCEPTION 'El perfil % no está activo; no se puede asignar al usuario %', NEW.id_perfil, NEW.clave_usuario;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_usuarios_perfil_activo
    BEFORE INSERT OR UPDATE OF id_perfil ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_usuarios_perfil_activo();

-- No dar de baja un perfil mientras tenga usuarios asignados
CREATE OR REPLACE FUNCTION fn_perfiles_baja() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.estatus = 'Inactivo' AND OLD.estatus = 'Activo' THEN
        IF EXISTS (SELECT 1 FROM usuarios WHERE id_perfil = NEW.id_perfil AND estatus = 'Activo') THEN
            RAISE EXCEPTION 'El perfil "%" tiene usuarios activos asignados; reasígnelos antes de darlo de baja', NEW.nombre;
        END IF;
        NEW.fecha_baja := coalesce(NEW.fecha_baja, CURRENT_DATE);
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_perfiles_baja
    BEFORE UPDATE OF estatus ON perfiles
    FOR EACH ROW EXECUTE FUNCTION fn_perfiles_baja();

-- Validación de motivo (ámbito correcto y comentario obligatorio si es "Otro")
CREATE OR REPLACE FUNCTION validar_motivo(p_motivo INTEGER, p_ambito VARCHAR, p_texto VARCHAR)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_motivo motivos_baja%ROWTYPE;
BEGIN
    SELECT * INTO v_motivo FROM motivos_baja WHERE id_motivo = p_motivo;
    IF v_motivo.aplica_a <> p_ambito THEN
        RAISE EXCEPTION 'El motivo "%" es de tipo % y no aplica a %', v_motivo.descripcion, v_motivo.aplica_a, p_ambito;
    END IF;
    IF v_motivo.descripcion = 'Otro' AND (p_texto IS NULL OR btrim(p_texto) = '') THEN
        RAISE EXCEPTION 'Cuando el motivo es "Otro" se debe escribir una descripción';
    END IF;
END $$;

-- Baja y reactivación de usuario
CREATE OR REPLACE FUNCTION fn_bajas_usuario() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM validar_motivo(NEW.id_motivo, 'Usuario', NEW.comentario);
        IF EXISTS (SELECT 1 FROM prestamos WHERE clave_usuario = NEW.clave_usuario AND estatus = 'Activo') THEN
            RAISE EXCEPTION 'El usuario % tiene préstamos activos; no se puede dar de baja', NEW.clave_usuario;
        END IF;
        IF EXISTS (SELECT 1 FROM bajas_usuario WHERE clave_usuario = NEW.clave_usuario AND fecha_reactivacion IS NULL
                   AND id_baja_usuario <> NEW.id_baja_usuario) THEN
            RAISE EXCEPTION 'El usuario % ya está dado de baja', NEW.clave_usuario;
        END IF;
        UPDATE usuarios SET estatus = 'Inactivo' WHERE clave_usuario = NEW.clave_usuario;
    ELSIF NEW.fecha_reactivacion IS NOT NULL AND OLD.fecha_reactivacion IS NULL THEN
        UPDATE usuarios SET estatus = 'Activo' WHERE clave_usuario = NEW.clave_usuario;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_bajas_usuario
    AFTER INSERT OR UPDATE OF fecha_reactivacion ON bajas_usuario
    FOR EACH ROW EXECUTE FUNCTION fn_bajas_usuario();

-- ---------------------------------------------------------------------
--  Autenticación: inicio de sesión con bloqueo de 15 min tras 3 intentos
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION iniciar_sesion(p_clave VARCHAR, p_contrasena VARCHAR, p_dispositivo VARCHAR DEFAULT NULL)
RETURNS TABLE (resultado VARCHAR, id_sesion INTEGER, perfil VARCHAR, cambiar_contrasena BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE
    v_cred credenciales%ROWTYPE;
    v_usr  usuarios%ROWTYPE;
    v_ses  INTEGER;
BEGIN
    SELECT * INTO v_usr FROM usuarios WHERE clave_usuario = p_clave;
    SELECT * INTO v_cred FROM credenciales WHERE clave_usuario = p_clave FOR UPDATE;
    IF v_usr.clave_usuario IS NULL OR v_cred.clave_usuario IS NULL THEN
        RETURN QUERY SELECT 'Usuario o contraseña incorrectos'::VARCHAR, NULL::INTEGER, NULL::VARCHAR, NULL::BOOLEAN; RETURN;
    END IF;
    IF v_usr.estatus <> 'Activo' THEN
        RETURN QUERY SELECT 'Usuario inactivo'::VARCHAR, NULL::INTEGER, NULL::VARCHAR, NULL::BOOLEAN; RETURN;
    END IF;
    IF v_cred.bloqueado_hasta IS NOT NULL AND v_cred.bloqueado_hasta > now() THEN
        RETURN QUERY SELECT ('Cuenta bloqueada hasta ' || to_char(v_cred.bloqueado_hasta, 'HH24:MI'))::VARCHAR,
                            NULL::INTEGER, NULL::VARCHAR, NULL::BOOLEAN; RETURN;
    END IF;
    IF v_cred.contrasena_hash <> crypt(p_contrasena, v_cred.contrasena_hash) THEN
        UPDATE credenciales
           SET intentos_fallidos = CASE WHEN intentos_fallidos + 1 >= 3 THEN 0 ELSE intentos_fallidos + 1 END,
               bloqueado_hasta   = CASE WHEN intentos_fallidos + 1 >= 3 THEN now() + INTERVAL '15 minutes' END
         WHERE clave_usuario = p_clave;
        PERFORM registrar_bitacora('Acceso fallido', 'Usuario ' || p_clave);
        RETURN QUERY SELECT 'Usuario o contraseña incorrectos'::VARCHAR, NULL::INTEGER, NULL::VARCHAR, NULL::BOOLEAN; RETURN;
    END IF;
    UPDATE credenciales SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = now()
     WHERE clave_usuario = p_clave;
    INSERT INTO sesiones (clave_usuario, dispositivo) VALUES (p_clave, p_dispositivo)
        RETURNING sesiones.id_sesion INTO v_ses;
    INSERT INTO bitacora (clave_usuario, accion, detalle) VALUES (p_clave, 'Inicio de sesión', 'Sesión ' || v_ses);
    RETURN QUERY SELECT 'OK'::VARCHAR, v_ses, p.nombre, v_cred.es_temporal
                 FROM perfiles p WHERE p.id_perfil = v_usr.id_perfil;
END $$;

CREATE OR REPLACE FUNCTION cerrar_sesion(p_sesion INTEGER)
RETURNS VOID LANGUAGE sql AS $$
    UPDATE sesiones SET fecha_fin = now() WHERE id_sesion = p_sesion AND fecha_fin IS NULL;
$$;

-- Guarda la contraseña como hash bcrypt
CREATE OR REPLACE FUNCTION asignar_contrasena(p_clave VARCHAR, p_contrasena VARCHAR, p_temporal BOOLEAN DEFAULT TRUE)
RETURNS VOID LANGUAGE sql AS $$
    INSERT INTO credenciales (clave_usuario, contrasena_hash, es_temporal)
    VALUES (p_clave, crypt(p_contrasena, gen_salt('bf')), p_temporal)
    ON CONFLICT (clave_usuario) DO UPDATE
        SET contrasena_hash = EXCLUDED.contrasena_hash, es_temporal = EXCLUDED.es_temporal,
            intentos_fallidos = 0, bloqueado_hasta = NULL;
$$;

-- Recuperación de contraseña: token de un solo uso, válido 30 minutos
CREATE OR REPLACE FUNCTION solicitar_recuperacion(p_clave_o_correo VARCHAR)
RETURNS VARCHAR LANGUAGE plpgsql AS $$
DECLARE
    v_clave VARCHAR(6);
    v_token VARCHAR;
    v_ahora TIMESTAMP := now();
BEGIN
    SELECT clave_usuario INTO v_clave FROM usuarios
     WHERE (clave_usuario = p_clave_o_correo OR lower(correo) = lower(p_clave_o_correo)) AND estatus = 'Activo';
    IF v_clave IS NULL THEN
        RETURN NULL;   -- no revela si el usuario existe
    END IF;
    v_token := encode(gen_random_bytes(24), 'hex');
    INSERT INTO recuperaciones_acceso (clave_usuario, token_hash, fecha_solicitud, fecha_expiracion)
    VALUES (v_clave, encode(digest(v_token, 'sha256'), 'hex'), v_ahora, v_ahora + INTERVAL '30 minutes');
    RETURN v_token;
END $$;

CREATE OR REPLACE FUNCTION restablecer_contrasena(p_token VARCHAR, p_nueva VARCHAR)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
    v_rec recuperaciones_acceso%ROWTYPE;
BEGIN
    SELECT * INTO v_rec FROM recuperaciones_acceso
     WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex') FOR UPDATE;
    IF v_rec.id_recuperacion IS NULL OR v_rec.usado OR v_rec.fecha_expiracion < now() THEN
        RETURN FALSE;
    END IF;
    UPDATE recuperaciones_acceso SET usado = TRUE WHERE id_recuperacion = v_rec.id_recuperacion;
    PERFORM asignar_contrasena(v_rec.clave_usuario, p_nueva, FALSE);
    INSERT INTO bitacora (clave_usuario, accion, detalle)
    VALUES (v_rec.clave_usuario, 'Restablecer contraseña', 'Recuperación ' || v_rec.id_recuperacion);
    RETURN TRUE;
END $$;

-- =====================================================================
--  2. GESTIÓN DE LIBROS
-- =====================================================================

-- Coherencia del ejemplar con el formato del libro
CREATE OR REPLACE FUNCTION fn_ejemplares_validar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_formato VARCHAR;
BEGIN
    SELECT formato INTO v_formato FROM libros WHERE id_libro = NEW.id_libro;
    IF v_formato = 'Digital' THEN
        IF NEW.tipo_uso <> 'Préstamo digital' OR NEW.id_ubicacion IS NOT NULL THEN
            RAISE EXCEPTION 'Un libro digital solo admite acceso "Préstamo digital" y sin ubicación física';
        END IF;
    ELSE
        IF NEW.tipo_uso = 'Préstamo digital' THEN
            RAISE EXCEPTION 'Un ejemplar físico no puede ser "Préstamo digital"';
        END IF;
        IF NEW.id_ubicacion IS NULL AND NEW.estatus IN ('Disponible', 'Prestado') THEN
            RAISE EXCEPTION 'El ejemplar físico % necesita una ubicación (estante y fila)', NEW.id_ejemplar;
        END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_ejemplares_validar
    BEFORE INSERT OR UPDATE ON ejemplares
    FOR EACH ROW EXECUTE FUNCTION fn_ejemplares_validar();

-- Baja de ejemplar
CREATE OR REPLACE FUNCTION fn_bajas_ejemplar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM validar_motivo(NEW.id_motivo, 'Ejemplar', NEW.descripcion);
    IF EXISTS (SELECT 1 FROM ejemplares WHERE id_ejemplar = NEW.id_ejemplar AND estatus = 'Prestado') THEN
        RAISE EXCEPTION 'El ejemplar % está prestado; regístrelo primero como devuelto o perdido', NEW.id_ejemplar;
    END IF;
    UPDATE ejemplares SET estatus = 'Baja' WHERE id_ejemplar = NEW.id_ejemplar;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_bajas_ejemplar
    BEFORE INSERT ON bajas_ejemplar
    FOR EACH ROW EXECUTE FUNCTION fn_bajas_ejemplar();

-- El pedido no puede rebasar el presupuesto del mes
CREATE OR REPLACE FUNCTION fn_detalle_pedido_presupuesto() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_presupuesto INTEGER;
    v_autorizado  DECIMAL(12,2);
    v_comprometido DECIMAL(14,2);
BEGIN
    SELECT p.id_presupuesto, pm.monto_autorizado INTO v_presupuesto, v_autorizado
      FROM pedidos_tesoreria p JOIN presupuestos_mensuales pm USING (id_presupuesto)
     WHERE p.id_pedido = NEW.id_pedido;
    SELECT coalesce(sum(d.cantidad * d.costo_unitario_mxn), 0) INTO v_comprometido
      FROM detalle_pedido d JOIN pedidos_tesoreria p USING (id_pedido)
     WHERE p.id_presupuesto = v_presupuesto AND p.estatus <> 'Rechazado'
       AND NOT (d.id_pedido = NEW.id_pedido AND d.numero_linea = NEW.numero_linea);
    IF v_comprometido + NEW.cantidad * NEW.costo_unitario_mxn > v_autorizado THEN
        RAISE EXCEPTION 'Presupuesto insuficiente: disponible % MXN, la línea cuesta % MXN',
            v_autorizado - v_comprometido, NEW.cantidad * NEW.costo_unitario_mxn;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_detalle_pedido_presupuesto
    BEFORE INSERT OR UPDATE ON detalle_pedido
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_pedido_presupuesto();

-- Un pedido necesita al menos una línea
CREATE OR REPLACE FUNCTION fn_pedido_con_lineas() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM detalle_pedido WHERE id_pedido = NEW.id_pedido) THEN
        RAISE EXCEPTION 'El pedido % no tiene líneas; un pedido enviado debe incluir al menos un libro', NEW.id_pedido;
    END IF;
    RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER trg_pedido_con_lineas
    AFTER INSERT ON pedidos_tesoreria
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_pedido_con_lineas();

-- =====================================================================
--  3 y 4. SOLICITUDES, PRÉSTAMOS Y RENOVACIONES
-- =====================================================================

-- Validación del préstamo y fecha de vencimiento
CREATE OR REPLACE FUNCTION fn_prestamos_autorizar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_usr     usuarios%ROWTYPE;
    v_tipo    tipos_usuario%ROWTYPE;
    v_ej      ejemplares%ROWTYPE;
    v_activos INTEGER;
BEGIN
    SELECT * INTO v_usr  FROM usuarios WHERE clave_usuario = NEW.clave_usuario;
    SELECT * INTO v_tipo FROM tipos_usuario WHERE id_tipo_usuario = v_usr.id_tipo_usuario;
    SELECT * INTO v_ej   FROM ejemplares WHERE id_ejemplar = NEW.id_ejemplar FOR UPDATE;

    IF NOT tiene_funcion(NEW.clave_bibliotecario, 'Préstamos') THEN
        RAISE EXCEPTION 'El usuario % no tiene permiso para autorizar préstamos', NEW.clave_bibliotecario;
    END IF;
    -- Condiciones del usuario
    IF v_usr.estatus <> 'Activo' THEN
        RAISE EXCEPTION 'Préstamo no autorizado: el usuario % está inactivo', NEW.clave_usuario;
    END IF;
    IF EXISTS (SELECT 1 FROM multas m JOIN prestamos p USING (id_prestamo)
               WHERE p.clave_usuario = NEW.clave_usuario AND m.estatus = 'Pendiente') THEN
        RAISE EXCEPTION 'Préstamo no autorizado: el usuario % debe multas', NEW.clave_usuario;
    END IF;
    IF EXISTS (SELECT 1 FROM prestamos WHERE clave_usuario = NEW.clave_usuario
               AND estatus = 'Activo' AND fecha_vencimiento < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Préstamo no autorizado: el usuario % tiene préstamos vencidos', NEW.clave_usuario;
    END IF;
    SELECT count(*) INTO v_activos FROM prestamos WHERE clave_usuario = NEW.clave_usuario AND estatus = 'Activo';
    IF v_activos >= v_tipo.max_ejemplares THEN
        RAISE EXCEPTION 'Préstamo no autorizado: el usuario ya tiene % ejemplares (máximo % para %)',
            v_activos, v_tipo.max_ejemplares, v_tipo.nombre;
    END IF;
    -- Condiciones del libro
    IF v_ej.estatus <> 'Disponible' THEN
        RAISE EXCEPTION 'Préstamo no autorizado: el ejemplar % no está disponible (%)', NEW.id_ejemplar, v_ej.estatus;
    END IF;
    IF v_ej.tipo_uso NOT IN ('Préstamo externo', 'Préstamo digital') THEN
        RAISE EXCEPTION 'Préstamo no autorizado: el ejemplar % es de uso "%"', NEW.id_ejemplar, v_ej.tipo_uso;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM libros WHERE id_libro = v_ej.id_libro AND estatus = 'Activo en catálogo') THEN
        RAISE EXCEPTION 'Préstamo no autorizado: el libro % no está activo en el catálogo', v_ej.id_libro;
    END IF;
    -- La solicitud, si existe, debe ser del mismo usuario y del mismo libro
    IF NEW.id_solicitud_prestamo IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM solicitudes_prestamo
         WHERE id_solicitud_prestamo = NEW.id_solicitud_prestamo AND estatus = 'Pendiente'
           AND clave_usuario = NEW.clave_usuario AND id_libro = v_ej.id_libro) THEN
        RAISE EXCEPTION 'La solicitud % no está pendiente o no corresponde a este usuario y libro', NEW.id_solicitud_prestamo;
    END IF;

    NEW.fecha_vencimiento := coalesce(NEW.fecha_vencimiento,
                                      sumar_dias_habiles(NEW.fecha_prestamo, v_tipo.dias_prestamo));
    RETURN NEW;
END $$;
CREATE TRIGGER trg_prestamos_autorizar
    BEFORE INSERT ON prestamos
    FOR EACH ROW EXECUTE FUNCTION fn_prestamos_autorizar();

-- Al prestar: ejemplar prestado, solicitud y lista de espera atendidas
CREATE OR REPLACE FUNCTION fn_prestamos_efectos() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_libro VARCHAR(7);
BEGIN
    UPDATE ejemplares SET estatus = 'Prestado' WHERE id_ejemplar = NEW.id_ejemplar
        RETURNING id_libro INTO v_libro;
    UPDATE solicitudes_prestamo SET estatus = 'Atendida' WHERE id_solicitud_prestamo = NEW.id_solicitud_prestamo;
    UPDATE lista_espera SET estatus = 'Atendido'
     WHERE clave_usuario = NEW.clave_usuario AND id_libro = v_libro AND estatus IN ('En espera', 'Notificado');
    PERFORM registrar_bitacora('Préstamo', 'Préstamo ' || NEW.id_prestamo || ' ejemplar ' || NEW.id_ejemplar
                                           || ' a ' || NEW.clave_usuario || ' vence ' || NEW.fecha_vencimiento);
    RETURN NULL;
END $$;
CREATE TRIGGER trg_prestamos_efectos
    AFTER INSERT ON prestamos
    FOR EACH ROW EXECUTE FUNCTION fn_prestamos_efectos();

-- Multa por retraso
CREATE OR REPLACE FUNCTION generar_multa_retraso(p_prestamo INTEGER, p_vencimiento DATE, p_fecha DATE)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    v_multa INTEGER;
BEGIN
    IF p_fecha <= p_vencimiento THEN
        RETURN NULL;
    END IF;
    INSERT INTO multas (id_prestamo, tipo, dias_retraso, tarifa_diaria_aplicada, fecha_generacion)
    SELECT p.id_prestamo, 'Retraso', p_fecha - p_vencimiento, t.multa_diaria, p_fecha
      FROM prestamos p
      JOIN usuarios u      ON u.clave_usuario = p.clave_usuario
      JOIN tipos_usuario t ON t.id_tipo_usuario = u.id_tipo_usuario
     WHERE p.id_prestamo = p_prestamo
    RETURNING id_multa INTO v_multa;
    RETURN v_multa;
END $$;

-- Renovación de préstamo
CREATE OR REPLACE FUNCTION fn_renovaciones_autorizar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_pre   prestamos%ROWTYPE;
    v_tipo  tipos_usuario%ROWTYPE;
    v_hechas INTEGER;
BEGIN
    SELECT * INTO v_pre FROM prestamos WHERE id_prestamo = NEW.id_prestamo FOR UPDATE;
    SELECT t.* INTO v_tipo FROM tipos_usuario t JOIN usuarios u USING (id_tipo_usuario)
     WHERE u.clave_usuario = v_pre.clave_usuario;

    IF NOT tiene_funcion(NEW.clave_autoriza, 'Préstamos') THEN
        RAISE EXCEPTION 'El usuario % no tiene permiso para autorizar renovaciones', NEW.clave_autoriza;
    END IF;
    IF v_pre.estatus <> 'Activo' THEN
        RAISE EXCEPTION 'Solo se renuevan préstamos activos (el préstamo % está %)', NEW.id_prestamo, v_pre.estatus;
    END IF;
    SELECT count(*) INTO v_hechas FROM renovaciones WHERE id_prestamo = NEW.id_prestamo;
    IF v_hechas >= v_tipo.max_renovaciones THEN
        RAISE EXCEPTION 'Renovación no autorizada: ya se hicieron % renovaciones (máximo % para %)',
            v_hechas, v_tipo.max_renovaciones, v_tipo.nombre;
    END IF;

    NEW.vencimiento_anterior := v_pre.fecha_vencimiento;
    NEW.vencimiento_nuevo := coalesce(NEW.vencimiento_nuevo,
        sumar_dias_habiles(greatest(NEW.fecha_renovacion, v_pre.fecha_vencimiento), v_tipo.dias_prestamo));
    RETURN NEW;
END $$;
CREATE TRIGGER trg_renovaciones_autorizar
    BEFORE INSERT ON renovaciones
    FOR EACH ROW EXECUTE FUNCTION fn_renovaciones_autorizar();

CREATE OR REPLACE FUNCTION fn_renovaciones_efectos() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM generar_multa_retraso(NEW.id_prestamo, NEW.vencimiento_anterior, NEW.fecha_renovacion);
    UPDATE prestamos SET fecha_vencimiento = NEW.vencimiento_nuevo WHERE id_prestamo = NEW.id_prestamo;
    PERFORM registrar_bitacora('Renovación', 'Préstamo ' || NEW.id_prestamo || ' nuevo vencimiento ' || NEW.vencimiento_nuevo);
    RETURN NULL;
END $$;
CREATE TRIGGER trg_renovaciones_efectos
    AFTER INSERT ON renovaciones
    FOR EACH ROW EXECUTE FUNCTION fn_renovaciones_efectos();

-- =====================================================================
--  5. DEVOLUCIONES, MULTAS, PAGOS Y AVISOS
-- =====================================================================

-- Devolución de libro
CREATE OR REPLACE FUNCTION fn_devoluciones() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_pre   prestamos%ROWTYPE;
    v_libro VARCHAR(7);
BEGIN
    SELECT * INTO v_pre FROM prestamos WHERE id_prestamo = NEW.id_prestamo FOR UPDATE;
    IF v_pre.estatus <> 'Activo' THEN
        RAISE EXCEPTION 'El préstamo % no está activo (%); no se puede registrar la devolución', NEW.id_prestamo, v_pre.estatus;
    END IF;
    IF NEW.fecha_devolucion < v_pre.fecha_prestamo THEN
        RAISE EXCEPTION 'La fecha de devolución no puede ser anterior a la del préstamo';
    END IF;

    UPDATE prestamos SET estatus = 'Devuelto' WHERE id_prestamo = NEW.id_prestamo;
    UPDATE ejemplares SET estatus = 'Disponible', condicion = NEW.condicion_recibida
     WHERE id_ejemplar = v_pre.id_ejemplar RETURNING id_libro INTO v_libro;
    PERFORM generar_multa_retraso(NEW.id_prestamo, v_pre.fecha_vencimiento, NEW.fecha_devolucion);

    UPDATE lista_espera SET estatus = 'Notificado'
     WHERE id_espera = (SELECT id_espera FROM lista_espera
                         WHERE id_libro = v_libro AND estatus = 'En espera'
                         ORDER BY fecha_registro, id_espera LIMIT 1);
    PERFORM registrar_bitacora('Devolución', 'Préstamo ' || NEW.id_prestamo || ' ejemplar ' || v_pre.id_ejemplar);
    RETURN NEW;
END $$;
CREATE TRIGGER trg_devoluciones
    AFTER INSERT ON devoluciones
    FOR EACH ROW EXECUTE FUNCTION fn_devoluciones();

-- Pago de multa
CREATE OR REPLACE FUNCTION fn_pagos_multa() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM multas WHERE id_multa = NEW.id_multa AND estatus = 'Pendiente') THEN
        RAISE EXCEPTION 'La multa % no está pendiente de pago', NEW.id_multa;
    END IF;
    UPDATE multas SET estatus = 'Pagada' WHERE id_multa = NEW.id_multa;
    PERFORM registrar_bitacora('Pago de multa', 'Multa ' || NEW.id_multa || ' folio ' || NEW.folio_tesoreria);
    RETURN NEW;
END $$;
CREATE TRIGGER trg_pagos_multa
    BEFORE INSERT ON pagos_multa
    FOR EACH ROW EXECUTE FUNCTION fn_pagos_multa();

-- Libro perdido
CREATE OR REPLACE FUNCTION reportar_perdida(p_prestamo INTEGER, p_tipo_cambio DECIMAL, p_admin VARCHAR)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    v_pre    prestamos%ROWTYPE;
    v_precio DECIMAL(10,2);
    v_multa  INTEGER;
BEGIN
    SELECT * INTO v_pre FROM prestamos WHERE id_prestamo = p_prestamo FOR UPDATE;
    IF v_pre.estatus IS DISTINCT FROM 'Activo' THEN
        RAISE EXCEPTION 'Solo un préstamo activo puede reportarse como perdido';
    END IF;
    SELECT l.precio_ultima_compra_usd INTO v_precio
      FROM ejemplares e JOIN libros l USING (id_libro) WHERE e.id_ejemplar = v_pre.id_ejemplar;
    IF v_precio IS NULL THEN
        RAISE EXCEPTION 'El libro no tiene precio de última compra; Tesorería debe confirmarlo antes de generar la multa';
    END IF;

    INSERT INTO multas (id_prestamo, tipo, precio_usd_aplicado, tipo_cambio)
    VALUES (p_prestamo, 'Reposición', v_precio, p_tipo_cambio) RETURNING id_multa INTO v_multa;
    UPDATE prestamos  SET estatus = 'Perdido' WHERE id_prestamo = p_prestamo;
    UPDATE ejemplares SET estatus = 'Perdido' WHERE id_ejemplar = v_pre.id_ejemplar;
    INSERT INTO avisos (clave_usuario, id_multa, area_destino, tipo) VALUES
        (v_pre.clave_usuario, v_multa, 'Servicios Escolares', 'Libro perdido'),
        (v_pre.clave_usuario, v_multa, 'Tesorería',           'Libro perdido');
    INSERT INTO notificaciones_tesoreria (id_multa, clave_emisor) VALUES (v_multa, p_admin);
    INSERT INTO bitacora (clave_usuario, accion, detalle)
    VALUES (p_admin, 'Libro perdido', 'Préstamo ' || p_prestamo || ' multa ' || v_multa);
    RETURN v_multa;
END $$;

-- Lista de suspendidos para época de exámenes
CREATE OR REPLACE FUNCTION generar_avisos_suspension(p_bibliotecario VARCHAR)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    v_total INTEGER;
BEGIN
    INSERT INTO avisos (clave_usuario, id_multa, area_destino, tipo)
    SELECT d.clave_usuario, d.multa_pendiente, 'Servicios Escolares', 'Suspensión por adeudo'
      FROM v_deudores d
     WHERE NOT EXISTS (SELECT 1 FROM avisos a
                        WHERE a.clave_usuario = d.clave_usuario AND a.tipo = 'Suspensión por adeudo'
                          AND a.fecha_aviso = CURRENT_DATE);
    GET DIAGNOSTICS v_total = ROW_COUNT;
    INSERT INTO bitacora (clave_usuario, accion, detalle)
    VALUES (p_bibliotecario, 'Lista de suspendidos', v_total || ' avisos a Servicios Escolares');
    RETURN v_total;
END $$;

-- =====================================================================
--  BITÁCORA
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_bitacora() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_fila JSONB := to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);
BEGIN
    PERFORM registrar_bitacora(
        initcap(lower(TG_OP)) || ' ' || lower(TG_TABLE_NAME),
        TG_ARGV[0] || ' = ' || coalesce(v_fila ->> lower(TG_ARGV[0]), '?'));
    RETURN NULL;
END $$;

CREATE TRIGGER trg_bit_usuarios  AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_bitacora('Clave_Usuario');
CREATE TRIGGER trg_bit_perfiles  AFTER INSERT OR UPDATE OR DELETE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION fn_bitacora('ID_Perfil');
CREATE TRIGGER trg_bit_libros    AFTER INSERT OR UPDATE OR DELETE ON libros
    FOR EACH ROW EXECUTE FUNCTION fn_bitacora('ID_Libro');
CREATE TRIGGER trg_bit_ejemplares AFTER INSERT OR DELETE ON ejemplares
    FOR EACH ROW EXECUTE FUNCTION fn_bitacora('ID_Ejemplar');
CREATE TRIGGER trg_bit_pedidos   AFTER INSERT OR UPDATE ON pedidos_tesoreria
    FOR EACH ROW EXECUTE FUNCTION fn_bitacora('ID_Pedido');

-- =====================================================================
--  VISTAS
-- =====================================================================

-- Menú por rol: funciones que puede usar cada usuario
CREATE OR REPLACE VIEW v_menu_usuario AS
SELECT u.clave_usuario, u.nombre AS usuario, p.nombre AS perfil, f.nombre AS funcion
  FROM usuarios u
  JOIN perfiles p        ON p.id_perfil = u.id_perfil
  JOIN perfil_funcion pf ON pf.id_perfil = p.id_perfil
  JOIN funciones f       ON f.id_funcion = pf.id_funcion
 WHERE u.estatus = 'Activo' AND p.estatus = 'Activo';

-- Catálogo para la búsqueda
CREATE OR REPLACE VIEW v_catalogo AS
SELECT l.id_libro, l.titulo, l.isbn, l.formato,
       (SELECT string_agg(a.nombre, ', ' ORDER BY la.es_principal DESC, a.nombre)
          FROM libro_autor la JOIN autores a USING (id_autor)
         WHERE la.id_libro = l.id_libro)                                   AS autores,
       e.nombre AS editorial, t.nombre AS tema, l.anio_publicacion,
       count(x.id_ejemplar) FILTER (WHERE x.estatus <> 'Baja')             AS ejemplares,
       count(x.id_ejemplar) FILTER (WHERE x.estatus = 'Disponible'
                                    AND x.tipo_uso IN ('Préstamo externo', 'Préstamo digital')) AS disponibles_prestamo,
       count(x.id_ejemplar) FILTER (WHERE x.estatus = 'Disponible')        AS disponibles_total
  FROM libros l
  JOIN editoriales e ON e.id_editorial = l.id_editorial
  JOIN temas t       ON t.id_tema = l.id_tema
  LEFT JOIN ejemplares x ON x.id_libro = l.id_libro
 WHERE l.estatus = 'Activo en catálogo'
 GROUP BY l.id_libro, e.nombre, t.nombre;

-- Préstamos activos con días restantes y bandera de vencido
CREATE OR REPLACE VIEW v_prestamos_activos AS
SELECT p.id_prestamo, p.clave_usuario, u.nombre AS usuario, p.id_ejemplar, l.titulo,
       p.fecha_prestamo, p.fecha_vencimiento,
       p.fecha_vencimiento - CURRENT_DATE                     AS dias_restantes,
       p.fecha_vencimiento < CURRENT_DATE                     AS vencido,
       (SELECT count(*) FROM renovaciones r WHERE r.id_prestamo = p.id_prestamo) AS renovaciones
  FROM prestamos p
  JOIN usuarios u   ON u.clave_usuario = p.clave_usuario
  JOIN ejemplares e ON e.id_ejemplar = p.id_ejemplar
  JOIN libros l     ON l.id_libro = e.id_libro
 WHERE p.estatus = 'Activo';

-- Multas pendientes con el usuario que las debe
CREATE OR REPLACE VIEW v_multas_pendientes AS
SELECT m.id_multa, p.clave_usuario, u.nombre AS usuario, m.tipo, m.monto, m.fecha_generacion, m.id_prestamo
  FROM multas m
  JOIN prestamos p ON p.id_prestamo = m.id_prestamo
  JOIN usuarios u  ON u.clave_usuario = p.clave_usuario
 WHERE m.estatus = 'Pendiente';

-- Deudores
CREATE OR REPLACE VIEW v_deudores AS
SELECT u.clave_usuario, u.nombre, t.nombre AS tipo_usuario,
       (SELECT count(*) FROM prestamos p WHERE p.clave_usuario = u.clave_usuario
           AND p.estatus = 'Activo' AND p.fecha_vencimiento < CURRENT_DATE)            AS libros_vencidos,
       (SELECT coalesce(sum(m.monto), 0) FROM v_multas_pendientes m
         WHERE m.clave_usuario = u.clave_usuario)                                        AS adeudo_mxn,
       (SELECT min(m.id_multa) FROM v_multas_pendientes m
         WHERE m.clave_usuario = u.clave_usuario)                                        AS multa_pendiente
  FROM usuarios u
  JOIN tipos_usuario t ON t.id_tipo_usuario = u.id_tipo_usuario
 WHERE EXISTS (SELECT 1 FROM prestamos p WHERE p.clave_usuario = u.clave_usuario
                  AND p.estatus = 'Activo' AND p.fecha_vencimiento < CURRENT_DATE)
    OR EXISTS (SELECT 1 FROM v_multas_pendientes m WHERE m.clave_usuario = u.clave_usuario);

-- Saldo del presupuesto mensual
CREATE OR REPLACE VIEW v_presupuesto_saldo AS
SELECT pm.id_presupuesto, pm.periodo, pm.monto_autorizado,
       coalesce(sum(d.cantidad * d.costo_unitario_mxn) FILTER (WHERE p.estatus <> 'Rechazado'), 0) AS comprometido,
       pm.monto_autorizado
         - coalesce(sum(d.cantidad * d.costo_unitario_mxn) FILTER (WHERE p.estatus <> 'Rechazado'), 0) AS saldo
  FROM presupuestos_mensuales pm
  LEFT JOIN pedidos_tesoreria p ON p.id_presupuesto = pm.id_presupuesto
  LEFT JOIN detalle_pedido d    ON d.id_pedido = p.id_pedido
 GROUP BY pm.id_presupuesto;

-- Chatbot: preguntas activas con sus fuentes activas
CREATE OR REPLACE VIEW v_chatbot AS
SELECT q.id_pregunta, q.pregunta, q.respuesta,
       string_agg(c.referencia, '; ' ORDER BY c.referencia) AS fuentes
  FROM preguntas_chatbot q
  LEFT JOIN pregunta_contenido pc ON pc.id_pregunta = q.id_pregunta
  LEFT JOIN contenidos_chatbot c  ON c.id_contenido = pc.id_contenido AND c.estatus = 'Activo'
 WHERE q.estatus = 'Activa'
 GROUP BY q.id_pregunta;
