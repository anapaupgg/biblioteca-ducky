const ChatbotModel = { sugerencias: () => Api.get('/chatbot'), preguntar: q => Api.get('/chatbot', { q }) };
