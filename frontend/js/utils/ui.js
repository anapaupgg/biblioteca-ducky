/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Funciones de apoyo para las vistas. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   ui.esc(texto) */
/*   ui.fecha(valor) */
/*   ui.fecha_hora(valor) */
/*   ui.hoy() */
/*   ui.dinero(valor) */
/*   ui.badge(texto) */
/*   ui.alerta(destino, tipo, titulo, texto) */
/*   ui.toast(tipo, titulo, texto) */
/*   ui.dialogo(opciones) */
/*   ui.tabla(destino, columnas, filas, opciones) */
/*   ui.leer(ids, raiz) */
/*   ui.marcar(campos, raiz) */
/*   ui.limpiar(raiz) */
/*   ui.mostrar_error(error, destino, titulo) */
/*   ui.param(nombre) */
/*   ui.opciones(lista, valor, etiqueta, seleccionado, vacio) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* Status texts and the badge color they get                      */
const COLOR_ESTATUS =
{
    'Activo': 'ok',
    'Activa': 'ok',
    'Disponible': 'ok',
    'Activo en catálogo': 'ok',
    'Pagada': 'ok',
    'Recibido': 'ok',
    'Autorizado': 'ok',
    'Atendida': 'ok',
    'Atendido': 'ok',
    'Devuelto': 'muted',
    'Recibida': 'ok',
    'Bueno': 'ok',
    'Inactivo': 'muted',
    'Inactiva': 'muted',
    'Baja': 'muted',
    'Retirado': 'muted',
    'Cancelada': 'muted',
    'Cancelado': 'muted',
    'Pendiente': 'warning',
    'Enviado': 'warning',
    'Enviada': 'warning',
    'Ficha creada': 'warning',
    'En espera': 'warning',
    'Notificado': 'ok',
    'Prestado': '',
    'Regular': 'warning',
    'Reservado': 'warning',
    'Vencido': 'error',
    'Perdido': 'error',
    'Dañado': 'error',
    'Rechazado': 'error',
    'Error': 'error'
};

const ui =
{
    esc: function (texto)
    {
        return String(texto === null || texto === undefined ? '' : texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g,
                '&quot;').replace(/'/g, '&#39;');
    },

    fecha: function (valor)
    {
        if (!valor) return '—';
        const [primero_2, mensaje, datos_2] = String(valor).slice(0, 10).split('-');
        return Number(datos_2) + ' ' + MESES[Number(mensaje) - 1] + ' ' + primero_2;
    },

    fecha_hora: function (valor)
    {
        if (!valor) return '—';
        const filtro = new Date(valor);
        return filtro.getDate() + ' ' + MESES[filtro.getMonth()] + ' ' + filtro.getFullYear() + ', ' +
            String(filtro.getHours()).padStart(2, '0') + ':' + String(filtro.getMinutes()).padStart(2,
                '0');
    },

    hoy: function ()
    {
        const filtro_2 = new Date();
        return filtro_2.getFullYear() + '-' + String(filtro_2.getMonth() + 1).padStart(2, '0') + '-' +
            String(filtro_2.getDate()).padStart(2, '0');
    },

    dinero: function (valor)
    {
        return '$' + Number(valor || 0).toLocaleString('es-MX',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' MXN';
    },

    badge: function (texto)
    {
        const color = COLOR_ESTATUS[texto];
        return '<span class="badge' + (color ? ' badge-' + color : '') + '">' + this.esc(texto) +
            '</span>';
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* ui.alerta(destino, tipo, titulo, texto)                    */
    /* Purpose: Render an alert inside an element.                */
    /*   tipo: 'ok' | 'error' | 'warning' | 'info'                */
    /*   destino: element or id. Empty titulo clears the alert.   */
    /**************************************************************/
    alerta: function (destino, tipo, titulo, texto)
    {
        const elemento = typeof destino === 'string' ? document.getElementById(destino) : destino;
        if (!elemento) return;
        if (!titulo)
        {
            elemento.innerHTML = '';
            return;
        }
        elemento.innerHTML = '<div class="alert alert-' + tipo + '" role="' + (tipo === 'error' ?
                'alert' : 'status') + '">' +
            '<strong>' + this.esc(titulo) + '</strong>' + (texto ? '<span>' + this.esc(texto) +
                '</span>' : '') + '</div>';
    },

    toast: function (tipo, titulo, texto)
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
    /* ui.dialogo({ titulo, texto, cuerpo, confirmar, cancelar,   */
    /*              peligro, al_confirmar })                      */
    /* Purpose: Modal dialog. "cuerpo" is extra HTML (a form).    */
    /*          If al_confirmar(dialog) returns a Promise that     */
    /*          rejects, the dialog stays open showing the error. */
    /* Returns: Promise<boolean> true when confirmed              */
    /**************************************************************/
    dialogo: function (opciones)
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
                (opciones.cancelar === false ? '' :
                    '<button class="btn" data-accion="cancelar">' + this.esc(opciones
                        .cancelar || 'Cancelar') + '</button>') +
                '<button class="btn ' + (opciones.peligro ? 'btn-danger' : 'btn-primary') +
                '" data-accion="confirmar">' +
                this.esc(opciones.confirmar || 'Aceptar') + '</button></div></div>';
            document.body.appendChild(overlay);

            const cerrar = (valor) =>
            {
                overlay.remove();
                document.removeEventListener('keydown', teclas);
                resolver(valor);
            };
            const teclas = (elemento_2) =>
            {
                if (elemento_2.key === 'Escape') cerrar(false);
            };
            document.addEventListener('keydown', teclas);

            overlay.querySelector('[data-accion="confirmar"]').addEventListener('click',
            async (elemento_3) =>
                {
                    if (!opciones.al_confirmar) return cerrar(true);
                    const boton = elemento_3.currentTarget;
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
                        this.alerta(overlay.querySelector('.dialogo-mensaje'),
                            'error', error.message);
                    }
                });
            const cancelar = overlay.querySelector('[data-accion="cancelar"]');
            if (cancelar) cancelar.addEventListener('click', () => cerrar(false));
            const primero = overlay.querySelector(
                'input, select, textarea, button[data-accion="confirmar"]');
            if (primero) primero.focus();
        });
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* ui.tabla(destino, columnas, filas, opciones)               */
    /* Purpose: Render rows as a table.                           */
    /*   columnas: [{ titulo, valor: (fila) => html }]            */
    /*   opciones: { vacio, al_click(fila) }                      */
    /**************************************************************/
    tabla: function (destino, columnas, filas, opciones)
    {
        const elemento = typeof destino === 'string' ? document.getElementById(destino) : destino;
        const cfg = opciones ||
        {
        };
        if (!filas || filas.length === 0)
        {
            elemento.innerHTML = '<div class="empty">' + this.esc(cfg.vacio || 'No hay registros') +
                '</div>';
            return;
        }
        elemento.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr>' +
            columnas.map((campo_2) => '<th>' + this.esc(campo_2.titulo) + '</th>').join('') +
            '</tr></thead><tbody>' +
            filas.map((filtro_3, indice) => '<tr data-i="' + indice + '"' + (cfg.al_click ?
                    ' class="clickable"' : '') + '>' +
                columnas.map((campo_3) => '<td>' + campo_3.valor(filtro_3) + '</td>').join('') +
                '</tr>').join('') +
            '</tbody></table></div>';
        if (cfg.al_click)
        {
            elemento.querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', (
                elemento_4) =>
            {
                if (elemento_4.target.closest('button, a')) return;
                cfg.al_click(filas[Number(tr.dataset.i)]);
            }));
        }
    },

    leer: function (ids, raiz)
    {
        const datos =
        {
        };
        ids.forEach((id) =>
        {
            const elemento_5 = (raiz || document).querySelector('#' + id);
            if (elemento_5) datos[id] = elemento_5.type === 'checkbox' ? elemento_5.checked :
                elemento_5.value.trim();
        });
        return datos;
    },

    marcar: function (campos, raiz)
    {
        this.limpiar(raiz);
        (campos || []).forEach((campo) =>
        {
            const elemento_6 = (raiz || document).querySelector('#' + campo);
            if (elemento_6 && elemento_6.closest('.field')) elemento_6.closest('.field')
                .classList.add('field-error');
        });
    },

    limpiar: function (raiz)
    {
        (raiz || document).querySelectorAll('.field-error').forEach((filtro_4) => filtro_4.classList
            .remove('field-error'));
    },

    /**************************************************************/
    /* Reuse Instructions                                         */
    /* ui.mostrar_error(error, destino, titulo)                   */
    /* Purpose: Show an ApiError as an alert and mark the fields  */
    /*          the backend reported in error.campos              */
    /**************************************************************/
    mostrar_error: function (error, destino, titulo)
    {
        this.marcar(error.campos || []);
        if (titulo) this.alerta(destino, 'error', titulo, error.message);
        else this.alerta(destino, 'error', error.message);
        const elemento_7 = typeof destino === 'string' ? document.getElementById(destino) : destino;
        if (elemento_7 && elemento_7.scrollIntoView) elemento_7.scrollIntoView(
        {
            behavior: 'smooth',
            block: 'nearest'
        });
    },

    param: function (nombre)
    {
        return new URLSearchParams(window.location.search).get(nombre);
    },

    opciones: function (lista, valor, etiqueta, seleccionado, vacio)
    {
        return (vacio ? '<option value="">' + this.esc(vacio) + '</option>' : '') +
            lista.map((opcion) => '<option value="' + this.esc(opcion[valor]) + '"' + (String(opcion[valor]) ===
                    String(seleccionado) ? ' selected' : '') + '>' +
                this.esc(typeof etiqueta === 'function' ? etiqueta(opcion) : opcion[etiqueta]) + '</option>')
            .join('');
    }
};
