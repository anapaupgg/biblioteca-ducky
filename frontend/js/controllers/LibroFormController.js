/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller of libro_form.html. Creates a ficha    */
/*              (optionally labeling copies) or edits one when    */
/*              opened with ?id=. Prefills from an order line     */
/*              with ?titulo=&isbn= (reception of new titles).    */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   LibroFormController.iniciar()  - Layout, catalogs, mode      */
/*   LibroFormController.guardar()  - Validate and save           */
/******************************************************************/

const OBLIGATORIOS_LIBRO = ['titulo', 'isbn', 'autores', 'editorial', 'tema'];

const LibroFormController =
{
    id: null,

    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'libros', migas: 'Gestionar libros / Ficha bibliográfica', funciones: ['Gestionar libros'] });
        if (!usuario) return;

        this.id = Ui.param('id');
        document.getElementById('formato').addEventListener('change', () => LibroFormView.ajustar_formato());
        document.getElementById('menos').addEventListener('click', () => LibroFormView.copias(-1));
        document.getElementById('mas').addEventListener('click', () => LibroFormView.copias(1));
        document.getElementById('form-libro').addEventListener('submit', (e) => { e.preventDefault(); this.guardar(); });
        LibroFormView.ajustar_formato();

        try
        {
            LibroFormView.catalogos(await LibroModel.catalogos());
            if (this.id) LibroFormView.modo_edicion(await LibroModel.detalle(this.id));
            ['titulo', 'isbn', 'editorial', 'autores'].forEach((c) => { if (Ui.param(c)) document.getElementById(c).value = Ui.param(c); });
        }
        catch (error) { LibroFormView.mensaje('error', error.message); }
    },

    guardar: async function()
    {
        const datos = LibroFormView.datos();
        Ui.limpiar();
        const vacios = OBLIGATORIOS_LIBRO.filter((c) => !datos[c]);
        if (!this.id && datos.copias > 0 && datos.formato === 'Físico' && !datos.id_ubicacion) vacios.push('id_ubicacion');
        if (vacios.length)
        {
            Ui.marcar(vacios);
            return LibroFormView.mensaje('error', 'Completa los datos obligatorios', 'Revisa los campos marcados.');
        }
        try
        {
            if (this.id)
            {
                await LibroModel.actualizar(this.id, datos);
                window.location.href = 'libro_detalle.html?id=' + encodeURIComponent(this.id) + '&ok=editado';
            }
            else
            {
                LibroFormView.creado(await LibroModel.crear(datos));
            }
        }
        catch (error) { Ui.mostrar_error(error, 'mensaje'); }
    }
};
