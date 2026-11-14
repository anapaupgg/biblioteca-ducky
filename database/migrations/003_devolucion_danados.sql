-- Fecha: 2026-11-14. Aditiva; conserva préstamos, ejemplares e historial.
-- Una copia dañada queda en revisión y no avanza la espera hasta repararse.

ALTER TABLE ejemplares DROP CONSTRAINT ck_ejemplares_estatus;
ALTER TABLE ejemplares ADD CONSTRAINT ck_ejemplares_estatus
    CHECK (estatus IN ('Disponible', 'Prestado', 'En revisión', 'Perdido', 'Baja'));

CREATE OR REPLACE FUNCTION fn_ejemplares_validar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_formato VARCHAR;
BEGIN
    IF NEW.condicion = 'Dañado' AND NEW.estatus = 'Disponible' THEN
        NEW.estatus := 'En revisión';
    END IF;
    IF TG_OP = 'UPDATE' THEN
        IF OLD.estatus = 'En revisión' AND OLD.condicion = 'Dañado'
           AND NEW.condicion IN ('Bueno', 'Regular') THEN
            NEW.estatus := 'Disponible';
        END IF;
    END IF;
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

    IF NEW.condicion_recibida <> 'Dañado' THEN
        UPDATE lista_espera SET estatus = 'Notificado'
         WHERE id_espera = (SELECT id_espera FROM lista_espera
                             WHERE id_libro = v_libro AND estatus = 'En espera'
                             ORDER BY fecha_registro, id_espera LIMIT 1);
    END IF;
    PERFORM registrar_bitacora('Devolución', 'Préstamo ' || NEW.id_prestamo || ' ejemplar ' || v_pre.id_ejemplar);
    RETURN NEW;
END $$;

UPDATE ejemplares SET estatus = 'En revisión'
 WHERE condicion = 'Dañado' AND estatus = 'Disponible';
