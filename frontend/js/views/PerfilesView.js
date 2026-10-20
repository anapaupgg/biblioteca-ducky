/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: View of perfiles.html:                            */
/*              profiles table and the create/edit form with one  */
/*              checkbox per function.                            */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   PerfilesView.tabla(perfiles, acciones)   - Profiles list     */
/*   PerfilesView.formulario(funciones, p)    - Create/edit form  */
/*   PerfilesView.datos()                     - Form values       */
/*   PerfilesView.cerrar_formulario()         - Hide form         */
/******************************************************************/

const PerfilesView =
{
    tabla: function(perfiles, acciones)
    {
        Ui.tabla('tabla',
        [
            { titulo: 'Perfil',      valor: (p) => '<strong>' + Ui.esc(p.nombre) + '</strong>' },
            { titulo: 'Descripción', valor: (p) => Ui.esc(p.descripcion || '—') },
            { titulo: 'Funciones',   valor: (p) => p.funciones.map((f) => '<span class="badge" style="margin:2px">' + Ui.esc(f) + '</span>').join(' ') },
            { titulo: 'Usuarios',    valor: (p) => String(p.usuarios) },
            { titulo: 'Estatus',     valor: (p) => Ui.badge(p.estatus) },
            { titulo: '',            valor: (p) => '<div class="row-actions">' + (p.id === 1 ? '<span class="small muted">Perfil base protegido</span>' :
                (p.estatus === 'Activo'
                    ? '<button class="btn btn-sm" data-editar="' + p.id + '">Editar funciones</button>' +
                      '<button class="btn btn-sm btn-danger" data-eliminar="' + p.id + '">Eliminar</button>'
                    : '<button class="btn btn-sm" data-reactivar="' + p.id + '">Reactivar</button>')) + '</div>' }
        ], perfiles);

        const buscar = (id) => perfiles.find((p) => p.id === Number(id));
        document.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => acciones.editar(buscar(b.dataset.editar))));
        document.querySelectorAll('[data-eliminar]').forEach((b) => b.addEventListener('click', () => acciones.eliminar(buscar(b.dataset.eliminar))));
        document.querySelectorAll('[data-reactivar]').forEach((b) => b.addEventListener('click', () => acciones.reactivar(buscar(b.dataset.reactivar))));
    },

    formulario: function(funciones, perfil)
    {
        const panel = document.getElementById('formulario');
        panel.classList.remove('hidden');
        panel.innerHTML =
            '<form id="form-perfil" novalidate>' +
            '<div class="card"><h2>' + (perfil ? 'Editar perfil ' + Ui.esc(perfil.nombre) : 'Datos del perfil') + '</h2>' +
            '<div class="grid-2">' +
            '<div class="field"><label for="nombre">Nombre del perfil</label><input id="nombre" maxlength="50" placeholder="Ej. Investigador"' +
                (perfil ? ' value="' + Ui.esc(perfil.nombre) + '" readonly' : '') + '></div>' +
            '<div class="field"><label for="descripcion">Descripción</label><input id="descripcion" maxlength="200" placeholder="Ej. Consulta avanzada del acervo" value="' +
                Ui.esc(perfil ? perfil.descripcion || '' : '') + '"></div></div></div>' +
            '<div class="card"><h2>Funciones autorizadas</h2><div class="checks" id="funciones">' +
            funciones.map((f) => '<label class="check"><input type="checkbox" value="' + f.id + '"' +
                (perfil && perfil.ids_funciones.includes(f.id) ? ' checked' : '') + '>' + Ui.esc(f.nombre) +
                '<span class="small muted">· ' + Ui.esc(f.descripcion || '') + '</span></label>').join('') +
            '</div></div>' +
            '<div class="actions"><button class="btn btn-primary" type="submit">Guardar perfil</button>' +
            '<button class="btn" type="button" id="btn-cancelar">Cancelar</button></div></form>';
        document.getElementById(perfil ? 'descripcion' : 'nombre').focus();
    },

    datos: function()
    {
        return {
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            funciones: [...document.querySelectorAll('#funciones input:checked')].map((c) => Number(c.value))
        };
    },

    marcar_funciones: function(si) { document.getElementById('funciones').closest('.card').style.borderColor = si ? 'var(--color-red)' : ''; },

    cerrar_formulario: function()
    {
        const panel = document.getElementById('formulario');
        panel.classList.add('hidden');
        panel.innerHTML = '';
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); }
};
