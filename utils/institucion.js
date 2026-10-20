/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Directorio de alumnos y empleados (simulado).     */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   DIRECTORIO              - Sample institutional records       */
/*   consultar(clave)        - Look up a matrícula or nómina      */
/******************************************************************/

/* vigente = false means the student graduated / contract ended   */
const DIRECTORIO =
[
    { clave: '100001', nombre: 'Diego Ramírez',     correo: 'diego.ramirez@ducky.edu.mx',     tipo: 'Colaborador', vigente: true },
    { clave: '100002', nombre: 'Pamela Torres',     correo: 'pamela.torres@ducky.edu.mx',     tipo: 'Colaborador', vigente: true },
    { clave: '100003', nombre: 'Katya Hernández',   correo: 'katya.hernandez@ducky.edu.mx',   tipo: 'Colaborador', vigente: true },
    { clave: '621234', nombre: 'Ana Paula García',  correo: 'ana.garcia@ducky.edu.mx',        tipo: 'Alumno',      vigente: true },
    { clave: '612345', nombre: 'Elías Moreno',      correo: 'elias.moreno@ducky.edu.mx',      tipo: 'Alumno',      vigente: true },
    { clave: '633456', nombre: 'Laura Sánchez',     correo: 'laura.sanchez@ducky.edu.mx',     tipo: 'Alumno',      vigente: true },
    { clave: '700123', nombre: 'Roberto Castillo',  correo: 'roberto.castillo@ducky.edu.mx',  tipo: 'Profesor',    vigente: true },
    { clave: '800456', nombre: 'Sofía Mendoza',     correo: 'sofia.mendoza@ducky.edu.mx',     tipo: 'Colaborador', vigente: true },
    { clave: '645678', nombre: 'Valeria López',     correo: 'valeria.lopez@ducky.edu.mx',     tipo: 'Alumno',      vigente: true },
    { clave: '651122', nombre: 'Mateo Garza',       correo: 'mateo.garza@ducky.edu.mx',       tipo: 'Alumno',      vigente: true },
    { clave: '702345', nombre: 'Carmen Ruiz',       correo: 'carmen.ruiz@ducky.edu.mx',       tipo: 'Profesor',    vigente: true },
    { clave: '810077', nombre: 'Jorge Treviño',     correo: 'jorge.trevino@ducky.edu.mx',     tipo: 'Colaborador', vigente: true },
    { clave: '600999', nombre: 'Luis Cantú',        correo: 'luis.cantu@ducky.edu.mx',        tipo: 'Alumno',      vigente: false },
    { clave: '655000', nombre: 'Andrea Salinas',    correo: null,                             tipo: 'Alumno',      vigente: true }
];

/******************************************************************/
/* Reuse Instructions                                             */
/* consultar(clave)                                               */
/* Purpose: Return the institutional record of a clave or null if */
/*          it does not exist in the institution.                 */
/* Returns: Promise resolving to { clave, nombre, correo, tipo,   */
/*          vigente } | null                                      */
/******************************************************************/
const consultar = async (clave) =>
    DIRECTORIO.find((persona) => persona.clave === String(clave || '').trim()) || null;

module.exports = { consultar, DIRECTORIO };
