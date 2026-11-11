# Preferencias del proyecto

- Al comenzar cada solicitud de trabajo, comprobar commits remotos con `git fetch origin` y comparar la rama actual con su upstream antes de editar.
- En cada solicitud de cambio, revisar también el historial y el contenido de los commits nuevos (archivos y diferencias), explicar qué cambió y evaluar su efecto sobre el trabajo solicitado antes de integrarlos o editar. Si no hay commits nuevos, indicarlo expresamente.
- Integrar avances compatibles sin perder cambios locales. No sobrescribir trabajo existente ni reiniciar la base de datos para actualizar el repositorio.
- Mantener CAMBIOS_Y_PLAN.txt con cambios realizados, verificaciones y pendientes; distinguir el trabajo local de los commits de otras personas.
- Al completar avances coherentes, crear commits y subirlos a GitHub; verificar el resultado del push. Incluir solo el trabajo de la solicitud y conservar los cambios locales ajenos sin incorporarlos automáticamente.

- Antes de nuevas funciones, mantener la separación MVC y el estándar del
  documento «Estandar de codificacion Biblioteca Ducky.docx», resumido en
  ESTANDAR_MVC.md. SQL en modelos; DOM y eventos en vistas; controladores
  coordinan. Mantener encabezados, contratos de uso y nombres descriptivos.

- El prototipo [Prototipo-AES](https://www.figma.com/design/sZgmHvy2YReNXevKvL4fUI/Prototipo-AES?node-id=0-1)
  es la referencia de diseño y flujos. Antes de cambiar una pantalla o crear una
  función, consultar en Figma los nodos correspondientes y compararlos con la
  implementación. Corregir diferencias verificables de presentación y
  comportamiento sin debilitar permisos ni perder datos. Registrar en
  FIGMA_ALINEACION.md lo comprobado y lo pendiente; no afirmar paridad de una
  pantalla sin compararla visualmente.
