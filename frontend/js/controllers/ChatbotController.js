const ChatbotController = {
    ocupado:false,
    async iniciar() {
        if(!await Layout.montar({activo:'chatbot',migas:'Asistente',funciones:['Chatbot']}))return;
        document.getElementById('chat-form').addEventListener('submit',e=>{e.preventDefault();this.preguntar(document.getElementById('chat-pregunta').value);});
        document.getElementById('chat-reintentar').onclick=()=>this.cargar();
        await this.cargar();
    },
    async cargar() {
        ChatbotView.estado('Cargando preguntas…');
        document.getElementById('chat-reintentar').classList.add('hidden');
        try { const r=await ChatbotModel.sugerencias();ChatbotView.sugerencias(r.sugerencias,q=>this.preguntar(q));ChatbotView.estado(r.sugerencias.length?'Elige una pregunta o escribe la tuya.':'Todavía no hay respuestas publicadas.'); }
        catch(e){ChatbotView.estado(e.message);document.getElementById('chat-reintentar').classList.remove('hidden');}
    },
    async preguntar(texto) {
        if(this.ocupado)return;
        const q=texto.trim();
        if(q.length<3 || q.length>300){ChatbotView.estado('Escribe una pregunta de 3 a 300 caracteres.');return;}
        this.ocupado=true;ChatbotView.ocupado(true);ChatbotView.estado('Consultando…');
        ChatbotView.mensaje(q,'usuario');
        try {
            const r=await ChatbotModel.preguntar(q);
            ChatbotView.mensaje(r.mensaje,'bot');
            r.resultados.forEach(f=>ChatbotView.mensaje(f.pregunta+'\n'+f.respuesta,'bot',f.fuentes));
            document.getElementById('chat-pregunta').value='';ChatbotView.estado('Consulta terminada.');
        } catch(e) {ChatbotView.mensaje('No pude completar la consulta. '+e.message,'bot');ChatbotView.estado('Puedes reintentar tu pregunta.');}
        finally {this.ocupado=false;ChatbotView.ocupado(false);document.getElementById('chat-pregunta').focus();}
    }
};
