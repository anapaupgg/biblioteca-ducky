-- Biblioteca Ducky · Equipo FlowBit · 2026-10-26
-- Separar solicitud y autorización de compras; decisión de Diego:
-- administradores de biblioteca y sistema autorizan; catálogo recibe.
-- Ejecutar mediante scripts/migrar-compras.js, una vez y en transacción.
INSERT INTO funciones (nombre, descripcion) VALUES
    ('Solicitar compras', 'Crear solicitudes de compra dentro del presupuesto'),
    ('Autorizar compras', 'Autorizar o rechazar solicitudes de compra')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO perfil_funcion (id_perfil, id_funcion)
SELECT perfil.id_perfil, funcion.id_funcion
FROM perfiles perfil CROSS JOIN funciones funcion
WHERE perfil.nombre IN ('Administrador del sistema', 'Administrador de biblioteca')
  AND funcion.nombre IN ('Solicitar compras', 'Autorizar compras')
ON CONFLICT DO NOTHING;
