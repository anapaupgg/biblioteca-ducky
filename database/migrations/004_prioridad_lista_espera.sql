-- Fecha: 2026-11-17. Aditiva: protege al primero de la lista de espera.
-- No reinicia ni elimina registros; redefine regla y disponibilidad del catálogo.
BEGIN;

CREATE OR REPLACE FUNCTION fn_prestamos_autorizar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_usr     usuarios%ROWTYPE;
    v_tipo    tipos_usuario%ROWTYPE;
    v_ej      ejemplares%ROWTYPE;
    v_activos INTEGER;
    v_libro   VARCHAR(7);
    v_libres  INTEGER;
    v_avisados INTEGER;
BEGIN
    SELECT * INTO v_usr  FROM usuarios WHERE clave_usuario = NEW.clave_usuario;
    SELECT * INTO v_tipo FROM tipos_usuario WHERE id_tipo_usuario = v_usr.id_tipo_usuario;
    SELECT id_libro INTO v_libro FROM ejemplares WHERE id_ejemplar = NEW.id_ejemplar;
    PERFORM 1 FROM libros WHERE id_libro = v_libro FOR UPDATE;
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
    IF v_ej.tipo_uso = 'Préstamo externo' THEN
        SELECT count(*) INTO v_libres FROM ejemplares
         WHERE id_libro = v_libro AND estatus = 'Disponible'
           AND tipo_uso = 'Préstamo externo';
        SELECT count(*) INTO v_avisados FROM lista_espera
         WHERE id_libro = v_libro AND estatus = 'Notificado';
        IF v_libres <= v_avisados AND NOT EXISTS (
            SELECT 1 FROM lista_espera WHERE id_libro = v_libro
              AND clave_usuario = NEW.clave_usuario AND estatus = 'Notificado') THEN
            RAISE EXCEPTION 'Préstamo no autorizado: los ejemplares disponibles están apartados para la lista de espera';
        END IF;
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

CREATE OR REPLACE VIEW v_catalogo AS
SELECT l.id_libro, l.titulo, l.isbn, l.formato,
       (SELECT string_agg(a.nombre, ', ' ORDER BY la.es_principal DESC, a.nombre)
          FROM libro_autor la JOIN autores a USING (id_autor)
         WHERE la.id_libro = l.id_libro)                                   AS autores,
       e.nombre AS editorial, t.nombre AS tema, l.anio_publicacion,
       count(x.id_ejemplar) FILTER (WHERE x.estatus <> 'Baja')             AS ejemplares,
       greatest(count(x.id_ejemplar) FILTER (WHERE x.estatus = 'Disponible'
                                    AND x.tipo_uso = 'Préstamo externo') -
           (SELECT count(*) FROM lista_espera w WHERE w.id_libro = l.id_libro
              AND w.estatus = 'Notificado'), 0) +
       count(x.id_ejemplar) FILTER (WHERE x.estatus = 'Disponible'
                                    AND x.tipo_uso = 'Préstamo digital') AS disponibles_prestamo,
       count(x.id_ejemplar) FILTER (WHERE x.estatus = 'Disponible')        AS disponibles_total
  FROM libros l
  JOIN editoriales e ON e.id_editorial = l.id_editorial
  JOIN temas t       ON t.id_tema = l.id_tema
  LEFT JOIN ejemplares x ON x.id_libro = l.id_libro
 WHERE l.estatus = 'Activo en catálogo'
 GROUP BY l.id_libro, e.nombre, t.nombre;

COMMIT;
