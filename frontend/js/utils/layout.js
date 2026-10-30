/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Menú lateral y barra superior. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   icono(nombre) */
/*   layout.montar(opciones) */
/*   layout.dibujar(usuario, opciones) */
/*   layout.cerrar_sesion() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Consultar las firmas y comentarios de cada operación antes de reutilizar. */
/* No registrar contraseñas, tokens ni secretos en mensajes o bitácoras. */
/******************************************************************/

const ICONOS =
{
    inicio: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    book: '<path d="M3 5.5C3 4.7 3.7 4 4.5 4H10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H3z"/><path d="M21 5.5c0-.8-.7-1.5-1.5-1.5H14a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
    retorno: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    document: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    cart: '<path d="M3 4h2l2.4 11h10.8L21 7H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4-6.5 8-6.5s7 2.3 8 6.5"/>',
    log: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
};

const icono = (nombre) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    ICONOS[nombre] + '</svg>';

/* Menu entries. "funciones": the entry appears when the profile has ANY of them */
const MENU = [
{
    id: 'chatbot',
    texto: 'Asistente',
    url: 'chatbot.html',
    icono: 'chat',
    funciones: ['Chatbot']
},
{
    id: 'inicio',
    texto: 'Inicio',
    url: 'inicio.html',
    icono: 'inicio',
    funciones: null
},
{
    id: 'usuarios',
    texto: 'Gestión de usuarios',
    url: 'usuarios.html',
    icono: 'usuarios',
    funciones: ['Gestionar usuarios']
},
{
    id: 'perfiles',
    texto: 'Perfiles y permisos',
    url: 'perfiles.html',
    icono: 'lock',
    funciones: ['Gestionar perfiles']
},
{
    id: 'libros',
    texto: 'Gestionar libros',
    url: 'libros.html',
    icono: 'book',
    funciones: ['Gestionar libros']
},
{
    id: 'pedidos',
    texto: 'Solicitudes a Tesorería',
    url: 'pedidos.html',
    icono: 'cart',
    funciones: ['Solicitar compras', 'Autorizar compras', 'Gestionar libros']
},
{
    id: 'buscar',
    texto: 'Buscar libros',
    url: 'buscar.html',
    icono: 'search',
    funciones: ['Buscar libros']
},
{
    id: 'prestamos',
    texto: 'Préstamos',
    url: 'prestamos.html',
    icono: 'retorno',
    funciones: ['Buscar libros', 'Préstamos']
},
{
    id: 'lista',
    texto: 'Lista de libros',
    url: 'lista_libros.html',
    icono: 'document',
    funciones: ['Buscar libros']
}];

const layout =
{
    /**************************************************************/
    /* Reuse Instructions                                         */
    /* layout.montar({ activo, migas, funciones })                */
    /* Purpose: 1) require a session (else go to login),          */
    /*          2) refresh the user from the server, 3) draw the  */
    /*          sidebar with ONLY the entries of the profile,     */
    /*          4) when the page needs a function the profile     */
    /*          lacks, replace the content with "Acceso denegado".*/
    /* Returns: Promise<usuario|null> (null = access denied)      */
    /**************************************************************/
    montar: async function (opciones)
    {
        if (!session.token())
        {
            window.location.href = 'login.html';
            return null;
        }

        let usuario = session.get();
        // La estructura no debe esperar a la red en cada navegación.
        // Los permisos y los datos siguen validándose en el servidor.
        const usuario_dibujado = usuario ? JSON.stringify(usuario) : null;
        if (usuario) this.dibujar(usuario, opciones);
        try
        {
            const respuesta = await api.get('/auth/sesion');
            usuario = respuesta.usuario;
            session.actualizar_usuario(usuario);
        }
        catch (error)
        {
            if (error.status === 401) return null;
            ui.toast('error', 'Sin conexión', error.message);
            if (!usuario) return null;
        }

        if (usuario.es_temporal && !window.location.pathname.endsWith('cambiar_contrasena.html'))
        {
            window.location.href = 'cambiar_contrasena.html';
            return null;
        }

        if (JSON.stringify(usuario) !== usuario_dibujado) this.dibujar(usuario, opciones);

        const requeridas = opciones.funciones || [];
        const permitido = requeridas.length === 0 || requeridas.some((filtro) => usuario.funciones
            .includes(filtro));
        if (!permitido)
        {
            document.getElementById('contenido').innerHTML =
                '<div class="page-header"><div><h1>Acceso denegado</h1>' +
                '<p>Su perfil no tiene permiso para esta función.</p></div></div>' +
                '<div class="alert alert-error"><strong>Acceso denegado: su perfil (' + ui.esc(usuario
                    .perfil) +
                ') no tiene permiso para ' + ui.esc(opciones.migas) + '.</strong>' +
                '<span>Solicite al Administrador del sistema que le asigne la función correspondiente.</span></div>' +
                '<a class="btn btn-primary" href="inicio.html">Volver al inicio</a>';
            return null;
        }

        return usuario;
    },

    dibujar: function (usuario, opciones)
    {
        const entradas = MENU.filter((entrada) => !entrada.funciones || entrada.funciones.some((filtro_2) => usuario
            .funciones.includes(filtro_2)));
        const sidebar = document.getElementById('sidebar');
        sidebar.className = 'sidebar';
        sidebar.innerHTML =
            '<a class="sidebar-logo" href="inicio.html"><img src="img/logo_ducky.png" alt="Universidad Ducky"></a>' +
            '<div class="sidebar-label">Biblioteca universitaria</div>' +
            '<div class="sidebar-label" style="margin-top:0">Navegación</div>' +
            '<nav class="nav" aria-label="Menú principal">' +
            entradas.map((entrada) => '<a href="' + entrada.url + '"' + (entrada.id === opciones.activo ?
                    ' class="active" aria-current="page"' : '') + '>' +
                icono(entrada.icono) + '<span>' + entrada.texto + '</span></a>').join('') + '</nav>' +
            '<div class="sidebar-footer"><strong>Universidad Ducky</strong><span>Sesión de biblioteca</span></div>';

        document.getElementById('topbar').innerHTML =
            '<div style="display:flex;align-items:center;gap:12px">' +
            '<button class="btn btn-sm menu-toggle" id="menu-toggle" aria-label="Abrir menú">' +
            icono('menu') + '</button>' +
            '<div class="breadcrumb">Biblioteca / ' + ui.esc(opciones.migas) + '</div></div>' +
            '<div class="topbar-right"><span>' + ui.esc(usuario.nombre) + ' · ' + ui.esc(usuario
                .perfil) + ' · Sesión activa</span>' +
            '<button class="btn" id="btn-cerrar-sesion">Cerrar sesión</button></div>';

        document.getElementById('btn-cerrar-sesion').addEventListener('click', () => this
            .cerrar_sesion());
        document.getElementById('menu-toggle').addEventListener('click', () => sidebar.classList
            .toggle('open'));
        document.title = 'Biblioteca Ducky · ' + opciones.migas;
    },

    cerrar_sesion: async function ()
    {
        try
        {
            await api.post('/auth/logout');
        }
        catch (error_2)
        {
            /* the session is cleared anyway */ }
        session.clear();
        window.location.href = 'login.html?salida=1';
    },

    icono: icono
};
