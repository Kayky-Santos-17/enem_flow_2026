const axios = require('axios');

/**
 * Controller: ai
 * Integração com IA local via Ollama (modelo llama3).
 *
 * Requisito: Ollama rodando em localhost com o modelo llama3 instalado.
 * Instalar: `ollama pull llama3`
 */

// POST /ai/chat
exports.chat = async (req, res) => {
  try {
    const { pergunta } = req.body;

    if (!pergunta || typeof pergunta !== 'string') {
      return res.status(400).json({ error: 'O campo "pergunta" é obrigatório.' });
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model: 'llama3',
        prompt: `Você é um tutor educacional especialista no ENEM. Responda de forma clara e didática:\n\n${pergunta}`,
        stream: false,
      },
      { timeout: 60000 } // 60s de timeout (IA pode demorar)
    );

    res.json({ resposta: response.data.response });
  } catch (error) {
    console.error('[ai.chat]', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Serviço de IA indisponível. Verifique se o Ollama está rodando.' });
    }

    res.status(500).json({ error: 'Erro ao consultar IA.' });
  }
};
