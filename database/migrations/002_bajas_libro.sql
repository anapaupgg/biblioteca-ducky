-- Migración aditiva. No modifica libros ni bajas previas.
CREATE TABLE IF NOT EXISTS bajas_libro (
    id_libro VARCHAR(7) PRIMARY KEY REFERENCES libros (id_libro),
    motivo VARCHAR(10) NOT NULL,
    descripcion VARCHAR(200),
    fecha_baja TIMESTAMPTZ NOT NULL DEFAULT now(),
    clave_administrador VARCHAR(6) NOT NULL REFERENCES usuarios (clave_usuario),
    CONSTRAINT ck_bajas_libro_motivo CHECK (motivo IN ('Perdido', 'Robado', 'Dañado', 'Obsoleto')),
    CONSTRAINT ck_bajas_libro_desc CHECK (descripcion IS NULL OR btrim(descripcion) <> '')
);
