const ChatbotView = {
    ocupado(si) {
        document.getElementById('chat-enviar').disabled=si;
        document.getElementById('chat-enviar').textContent=si?'Consultando…':'Enviar';
        document.getElementById('chat-sugerencias').querySelectorAll('button').forEach(b=>b.disabled=si);
    },
    estado(texto) { document.getElementById('chat-estado').textContent=texto; },
    sugerencias(lista, preguntar) {
        const caja=document.getElementById('chat-sugerencias');caja.replaceChildren();
        lista.forEach(f=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=f.pregunta;b.onclick=()=>preguntar(f.pregunta);caja.appendChild(b);});
    },
    mensaje(texto, tipo, fuentes=[]) {
        const caja=document.getElementById('chat-mensajes');
        const m=document.createElement('div');m.className='msg '+(tipo==='usuario'?'msg-user':'msg-bot');
        const p=document.createElement('p');p.textContent=texto;m.appendChild(p);
        fuentes.forEach(f=>{const s=document.createElement('small');s.textContent='Fuente: '+f;m.appendChild(s);});
        caja.appendChild(m);
        while(caja.children.length>40)caja.firstElementChild.remove();
        caja.scrollTop=caja.scrollHeight;
    }
};
