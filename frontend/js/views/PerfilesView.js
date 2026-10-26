/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   perfiles_view.enlazar(abrir) */
/*   perfiles_view.enlazar_formulario(guardar) */
/*   perfiles_view.tabla(perfiles, acciones) */
/*   perfiles_view.formulario(funciones, perfil) */
/*   perfiles_view.datos() */
/*   perfiles_view.marcar_funciones(si) */
/*   perfiles_view.cerrar_formulario() */
/*   perfiles_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const perfiles_view =
{
    enlazar: function (abrir)
    {
        document.getElementById('btn-nuevo').addEventListener('click', abrir);
    },
    enlazar_formulario: function (guardar)
    {
        document.getElementById('form-perfil').addEventListener('submit', evento =>
        {
            evento.preventDefault();
            guardar();
        });
        document.getElementById('btn-cancelar').addEventListener('click', () => this
            .cerrar_formulario());
    },
    tabla: function (perfiles, acciones)
    {
        ui.tabla('tabla',
            [
            {
                titulo: 'Perfil',
                valor: (perfil_2) => '<strong>' + ui.esc(perfil_2.nombre) + '</strong>'
            },
            {
                titulo: 'Descripción',
                valor: (perfil_3) => ui.esc(perfil_3.descripcion || '—')
            },
            {
                titulo: 'Funciones',
                valor: (perfil_4) => perfil_4.funciones.map((filtro) =>
                    '<span class="badge" style="margin:2px">' + ui.esc(filtro) + '</span>'
                    ).join(' ')
            },
            {
                titulo: 'Usuarios',
                valor: (perfil_5) => String(perfil_5.usuarios)
            },
            {
                titulo: 'Estatus',
                valor: (perfil_6) => ui.badge(perfil_6.estatus)
            },
            {
                titulo: '',
                valor: (perfil_7) => '<div class="row-actions">' + (perfil_7.id === 1 ?
                    '<span class="small muted">Perfil base protegido</span>' :
                    (perfil_7.estatus === 'Activo' ?
                        '<button class="btn btn-sm" data-editar="' + perfil_7.id +
                        '">Editar funciones</button>' +
                        '<button class="btn btn-sm btn-danger" data-eliminar="' + perfil_7
                        .id + '">Eliminar</button>' :
                        '<button class="btn btn-sm" data-reactivar="' + perfil_7.id +
                        '">Reactivar</button>')) + '</div>'
            }], perfiles);

        const buscar = (id) => perfiles.find((perfil_8) => perfil_8.id === Number(id));
        document.querySelectorAll('[data-editar]').forEach((boton) => boton.addEventListener('click',
            () => acciones.editar(buscar(boton.dataset.editar))));
        document.querySelectorAll('[data-eliminar]').forEach((boton_2) => boton_2.addEventListener(
            'click', () => acciones.eliminar(buscar(boton_2.dataset.eliminar))));
        document.querySelectorAll('[data-reactivar]').forEach((boton_3) => boton_3.addEventListener(
            'click', () => acciones.reactivar(buscar(boton_3.dataset.reactivar))));
    },

    formulario: function (funciones, perfil)
    {
        const panel = document.getElementById('formulario');
        panel.classList.remove('hidden');
        panel.innerHTML =
            '<form id="form-perfil" novalidate>' +
            '<div class="card"><h2>' + (perfil ? 'Editar perfil ' + ui.esc(perfil.nombre) :
                'Datos del perfil') + '</h2>' +
            '<div class="grid-2">' +
            '<div class="field"><label for="nombre">Nombre del perfil</label><input id="nombre" maxlength="50" placeholder="Ej. Investigador"' +
            (perfil ? ' value="' + ui.esc(perfil.nombre) + '" readonly' : '') + '></div>' +
            '<div class="field"><label for="descripcion">Descripción</label><input id="descripcion" maxlength="200" placeholder="Ej. Consulta avanzada del acervo" value="' +
            ui.esc(perfil ? perfil.descripcion || '' : '') + '"></div></div></div>' +
            '<div class="card"><h2>Funciones autorizadas</h2><div class="checks" id="funciones">' +
            funciones.map((filtro_2) => '<label class="check"><input type="checkbox" value="' +
                filtro_2.id + '"' +
                (perfil && perfil.ids_funciones.includes(filtro_2.id) ? ' checked' : '') + '>' + ui
                .esc(filtro_2.nombre) +
                '<span class="small muted">· ' + ui.esc(filtro_2.descripcion || '') +
                '</span></label>').join('') +
            '</div></div>' +
            '<div class="actions"><button class="btn btn-primary" type="submit">Guardar perfil</button>' +
            '<button class="btn" type="button" id="btn-cancelar">Cancelar</button></div></form>';
        document.getElementById(perfil ? 'descripcion' : 'nombre').focus();
    },

    datos: function ()
    {
        return (
        {
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            funciones: [...document.querySelectorAll('#funciones input:checked')].map((campo) =>
                Number(campo.value))
        });
    },

    marcar_funciones: function (si)
    {
        document.getElementById('funciones').closest('.card').style.borderColor = si ?
            'var(--color-red)' : '';
    },

    cerrar_formulario: function ()
    {
        const panel = document.getElementById('formulario');
        panel.classList.add('hidden');
        panel.innerHTML = '';
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};
