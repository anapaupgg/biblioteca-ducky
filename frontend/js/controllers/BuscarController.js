/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   buscar_controller.iniciar() */
/*   buscar_controller.buscar() */
/*   buscar_controller.limpiar() */
/*   buscar_controller.modificar() */
/*   buscar_controller.ejemplo(campo, valor) */
/*   buscar_controller.solicitar(libro) */
/*   buscar_controller.ficha(libro) */
/*   buscar_controller.volver_ficha_movil() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const buscar_controller =
{
    // Solo la consulta más reciente puede modificar resultados o errores.
    version_consulta: 0,
    ficha_actual: null,
    solicitud_en_curso: false,
    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'buscar',
            migas: 'Buscar libros',
            funciones: ['Buscar libros']
        });
        if (!usuario) return;
        buscar_view.enlazar(
        {
            buscar: (...argumentos) => this.buscar(...argumentos),
            limpiar: () => this.limpiar(),
            modificar: () => this.modificar(),
            ejemplo: (campo, valor) => this.ejemplo(campo, valor)
        });
        buscar_movil_view.iniciar({
            resultados: () => buscar_movil_view.resultados(),
            ficha: () => this.volver_ficha_movil(),
            ubicacion: () => buscar_movil_view.ubicacion(this.ficha_actual),
            prestado: () => buscar_movil_view.no_disponible(this.ficha_actual),
            solicitar: () => this.solicitar(this.ficha_actual.libro),
            lector: () => buscar_movil_view.lector(this.ficha_actual),
            'buscar-otro': () => this.buscar_otro()
        });

        if (ui.param('vista') === 'movil') buscar_view.activar_movil();

        const consulta = ui.param('q');
        if (consulta)
        {
            buscar_view.titulo(consulta);
            this.buscar();
        }
        else buscar_view.enfocar();
    },

    limpiar: function ()
    {
        this.version_consulta++;
        buscar_view.limpiar_filtros();
    },

    modificar: function ()
    {
        this.version_consulta++;
        buscar_view.modificar();
    },

    buscar_otro: function ()
    {
        this.version_consulta++;
        this.ficha_actual = null;
        buscar_view.limpiar_filtros();
    },

    volver_ficha_movil: function ()
    {
        if (this.ficha_actual) buscar_movil_view.ficha(this.ficha_actual);
    },

    ejemplo: function (campo, valor)
    {
        this.version_consulta++;
        buscar_view.ejemplo(campo, valor);
        this.buscar();
    },

    buscar: async function ()
    {
        const version = ++this.version_consulta;
        const filtros = buscar_view.filtros();
        ui.limpiar();
        buscar_view.vaciar();
        buscar_view.mensaje();
        const usados = Object.values(filtros).filter(Boolean);
        if (usados.length === 0)
        {
            buscar_view.mensaje('error', 'Escribe al menos un filtro de búsqueda');
            buscar_view.estado_movil('invalid', 'Introduce al menos un filtro. ' +
                'Los textos requieren 3 caracteres; el ISBN solo admite números, X o guiones.');
            return;
        }
        const cortos = ['titulo', 'autor', 'tema', 'editorial'].filter((campo) => filtros[campo] &&
            filtros[campo].length < 3);
        if (filtros.isbn && !/^[0-9X-]+$/i.test(filtros.isbn)) cortos.push('isbn');
        if (cortos.length)
        {
            ui.marcar(cortos);
            buscar_view.vaciar();
            buscar_view.mensaje('error', 'Verifica los filtros marcados',
                'Los textos requieren al menos 3 caracteres y el ISBN solo números.');
            buscar_view.estado_movil('invalid', 'Corrige los filtros indicados. ' +
                'Los textos requieren 3 caracteres; el ISBN solo admite números, X o guiones.');
            return;
        }
        try
        {
            const resultados = await busqueda_model.buscar(filtros);
            if (version !== this.version_consulta) return;
            buscar_view.resultados(resultados, filtros,
            {
                solicitar: (libro_2) => this.solicitar(libro_2),
                ficha: (libro_3) => this.ficha(libro_3),
                modificar: () => this.modificar(),
                limpiar: () => this.limpiar()
            });
        }
        catch (error)
        {
            if (version !== this.version_consulta) return;
            ui.mostrar_error(error, 'mensaje');
        }
    },

    solicitar: async function (libro)
    {
        if (this.solicitud_en_curso) return;
        this.solicitud_en_curso = true;
        try
        {
            const resultado = await busqueda_model.solicitar(libro.id_libro);
            if (buscar_movil_view.activo() && this.ficha_actual &&
                this.ficha_actual.libro.id_libro === libro.id_libro)
            {
                buscar_movil_view.solicitud(resultado, this.ficha_actual);
            }
            else
            {
                await buscar_view.solicitud(resultado);
                this.buscar();
            }
        }
        catch (error)
        {
            ui.toast('error', 'No se registró la solicitud', error.message);
        }
        finally
        {
            this.solicitud_en_curso = false;
        }
    },

    ficha: async function (libro)
    {
        try
        {
            const datos = await busqueda_model.ficha(libro.id_libro);
            this.ficha_actual = datos;
            if (buscar_movil_view.activo()) buscar_movil_view.ficha(datos);
            else buscar_view.ficha(datos);
        }
        catch (error)
        {
            ui.toast('error', error.message);
        }
    }
};
