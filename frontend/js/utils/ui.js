/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Shared view helpers (the components of the Ducky  */
/*              design system rendered in HTML): escaping, date   */
/*              and money formats, alerts, toast, dialogs, badges,*/
/*              tables and form validation marks. Views use these */
/*              helpers; they contain no business logic.          */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   Ui.esc(texto)                       - Escape HTML            */
/*   Ui.fecha(iso) / Ui.fecha_hora(iso)  - 27 oct 2026            */
/*   Ui.dinero(n)                        - $40.00 MXN             */
/*   Ui.badge(texto)                     - Status badge           */
/*   Ui.alerta(destino, tipo, titulo, t) - Ducky/Alert            */
/*   Ui.toast(tipo, titulo, texto)       - Floating alert         */
/*   Ui.dialogo(opciones)                - Ducky/Dialog (Promise) */
/*   Ui.tabla(destino, columnas, filas)  - Ducky/TableRow list    */
/*   Ui.leer(ids)                        - Read form values       */
/*   Ui.marcar(campos) / Ui.limpiar()    - Field error marks      */
/*   Ui.mostrar_error(error, destino)    - Show an ApiError       */
/*   Ui.param(nombre)                    - URL query parameter    */
/******************************************************************/

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* Status texts and the badge color they get                      */
const COLOR_ESTATUS =
{
    'Activo': 'ok', 'Activa': 'ok', 'Disponible': 'ok', 'Activo en catálogo': 'ok', 'Pagada': 'ok', 'Recibido': 'ok',
    'Autorizado': 'ok', 'Atendida': 'ok', 'Atendido': 'ok', 'Devuelto': 'muted', 'Recibida': 'ok', 'Bueno': 'ok',
    'Inactivo': 'muted', 'Inactiva': 'muted', 'Baja': 'muted', 'Retirado': 'muted', 'Cancelada': 'muted', 'Cancelado': 'muted',
    'Pendiente': 'warning', 'Enviado': 'warning', 'Enviada': 'warning', 'Ficha creada': 'warning', 'En espera': 'warning',
    'Notificado': 'ok', 'Prestado': '', 'Regular': 'warning', 'Reservado': 'warning',
    'Vencido': 'error', 'Perdido': 'error', 'Dañado': 'error', 'Rechazado': 'error', 'Error': 'error'
};

const Ui =
{
    esc: function(texto)
    {
        return String(texto === null || texto === undefined ? '' : texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    fecha: function(valor)
    {
        if (!valor) return '—';
        const [a, m, d] = String(valor).slice(0, 10).split('-');
        return Number(d) + ' ' + MESES[Number(m) - 1] + ' ' + a;
    },

    fecha_hora: function(valor)
    {
        if (!valor) return '—';
        const f = new Date(valor);
        return f.getDate() + ' ' + MESES[f.getMonth()] + ' ' + f.getFullYear() + ', ' +
               String(f.getHours()).padStart(2, '0') + ':' + String(f.getMinutes()).padStart(2, '0');
    },

    hoy: function()
    {
        const f = new Date();
        return f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0');
    },

    dinero: function(valor)
    {
        return '$' + Number(valor || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';
    },

    badge: function(texto)
    {
        const color = COLOR_ESTATUS[texto];
        return '<span class="badge' + (color ? ' badge-' + color : '') + '">' + this.esc(texto) + '</span>';
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* Ui.alerta(destino, tipo, titulo, texto)                    */
    /* Purpose: Render a Ducky/Alert inside an element.           */
    /*   tipo: 'ok' | 'error' | 'warning' | 'info'                */
    /*   destino: element or id. Empty titulo clears the alert.   */
    /**************************************************************/
    alerta: function(destino, tipo, titulo, texto)
    {
        const elemento = typeof destino === 'string' ? document.getElementById(destino) : destino;
        if (!elemento) return;
        if (!titulo) { elemento.innerHTML = ''; return; }
        elemento.innerHTML = '<div class="alert alert-' + tipo + '" role="' + (tipo === 'error' ? 'alert' : 'status') + '">' +
            '<strong>' + this.esc(titulo) + '</strong>' + (texto ? '<span>' + this.esc(texto) + '</span>' : '') + '</div>';
    },

    toast: function(tipo, titulo, texto)
    {
        const previo = document.querySelector('.toast');
        if (previo) previo.remove();
        const div = document.createElement('div');
        div.className = 'toast';
        document.body.appendChild(div);
        this.alerta(div, tipo, titulo, texto);
        setTimeout(() => div.remove(), 5000);
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* Ui.dialogo({ titulo, texto, cuerpo, confirmar, cancelar,   */
    /*              peligro, al_confirmar })                      */
    /* Purpose: Modal dialog. "cuerpo" is extra HTML (a form).    */
    /*          If al_confirmar(dialog) returns a Promise that     */
    /*          rejects, the dialog stays open showing the error. */
    /* Returns: Promise<boolean> true when confirmed              */
    /**************************************************************/
    dialogo: function(opciones)
    {
        return new Promise((resolver) =>
        {
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            overlay.innerHTML =
                '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo">' +
                '<h2 id="dialogo-titulo">' + this.esc(opciones.titulo) + '</h2>' +
                (opciones.texto ? '<p>' + this.esc(opciones.texto) + '</p>' : '') +
                (opciones.cuerpo || '') +
                '<div class="dialogo-mensaje"></div>' +
                '<div class="actions">' +
                (opciones.cancelar === false ? '' : '<button class="btn" data-accion="cancelar">' + this.esc(opciones.cancelar || 'Cancelar') + '</button>') +
                '<button class="btn ' + (opciones.peligro ? 'btn-danger' : 'btn-primary') + '" data-accion="confirmar">' +
                this.esc(opciones.confirmar || 'Aceptar') + '</button></div></div>';
            document.body.appendChild(overlay);

            const cerrar = (valor) => { overlay.remove(); document.removeEventListener('keydown', teclas); resolver(valor); };
            const teclas = (e) => { if (e.key === 'Escape') cerrar(false); };
            document.addEventListener('keydown', teclas);

            overlay.querySelector('[data-accion="confirmar"]').addEventListener('click', async (e) =>
            {
                if (!opciones.al_confirmar) return cerrar(true);
                const boton = e.currentTarget;
                boton.disabled = true;
                try
                {
                    await opciones.al_confirmar(overlay);
                    cerrar(true);
                }
                catch (error)
                {
                    boton.disabled = false;
                    this.marcar(error.campos || [], overlay);
                    this.alerta(overlay.querySelector('.dialogo-mensaje'), 'error', error.message);
                }
            });
            const cancelar = overlay.querySelector('[data-accion="cancelar"]');
            if (cancelar) cancelar.addEventListener('click', () => cerrar(false));
            const primero = overlay.querySelector('input, select, textarea, button[data-accion="confirmar"]');
            if (primero) primero.focus();
        });
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* Ui.tabla(destino, columnas, filas, opciones)               */
    /* Purpose: Render rows as Ducky/TableRow.                    */
    /*   columnas: [{ titulo, valor: (fila) => html }]            */
    /*   opciones: { vacio, al_click(fila) }                      */
    /**************************************************************/
    tabla: function(destino, columnas, filas, opciones)
    {
        const elemento = typeof destino === 'string' ? document.getElementById(destino) : destino;
        const cfg = opciones || {};
        if (!filas || filas.length === 0)
        {
            elemento.innerHTML = '<div class="empty">' + this.esc(cfg.vacio || 'No hay registros') + '</div>';
            return;
        }
        elemento.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr>' +
            columnas.map((c) => '<th>' + this.esc(c.titulo) + '</th>').join('') + '</tr></thead><tbody>' +
            filas.map((f, i) => '<tr data-i="' + i + '"' + (cfg.al_click ? ' class="clickable"' : '') + '>' +
                columnas.map((c) => '<td>' + c.valor(f) + '</td>').join('') + '</tr>').join('') +
            '</tbody></table></div>';
        if (cfg.al_click)
        {
            elemento.querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', (e) =>
            {
                if (e.target.closest('button, a')) return;
                cfg.al_click(filas[Number(tr.dataset.i)]);
            }));
        }
    },

    leer: function(ids, raiz)
    {
        const datos = {};
        ids.forEach((id) =>
        {
            const el = (raiz || document).querySelector('#' + id);
            if (el) datos[id] = el.type === 'checkbox' ? el.checked : el.value.trim();
        });
        return datos;
    },

    marcar: function(campos, raiz)
    {
        this.limpiar(raiz);
        (campos || []).forEach((campo) =>
        {
            const el = (raiz || document).querySelector('#' + campo);
            if (el && el.closest('.field')) el.closest('.field').classList.add('field-error');
        });
    },

    limpiar: function(raiz)
    {
        (raiz || document).querySelectorAll('.field-error').forEach((f) => f.classList.remove('field-error'));
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* Ui.mostrar_error(error, destino, titulo)                   */
    /* Purpose: Show an ApiError as an alert and mark the fields  */
    /*          the backend reported in error.campos              */
    /**************************************************************/
    mostrar_error: function(error, destino, titulo)
    {
        this.marcar(error.campos || []);
        if (titulo) this.alerta(destino, 'error', titulo, error.message);
        else this.alerta(destino, 'error', error.message);
        const el = typeof destino === 'string' ? document.getElementById(destino) : destino;
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    param: function(nombre) { return new URLSearchParams(window.location.search).get(nombre); },

    opciones: function(lista, valor, etiqueta, seleccionado, vacio)
    {
        return (vacio ? '<option value="">' + this.esc(vacio) + '</option>' : '') +
            lista.map((o) => '<option value="' + this.esc(o[valor]) + '"' + (String(o[valor]) === String(seleccionado) ? ' selected' : '') + '>' +
                this.esc(typeof etiqueta === 'function' ? etiqueta(o) : o[etiqueta]) + '</option>').join('');
    }
};
