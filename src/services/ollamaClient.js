import Ollama from 'ollama';

const ollama = new Ollama();

async function getLLMResponse(prompt) {
  try {
    const response = await ollama.chat({
      model: 'llama2', // or your chosen model name
      messages: [{ role: 'user', content: prompt }]
    });
    return response.message.content;
  } catch (err) {
    console.error('Ollama API error:', err);
    throw err;
  }
}

export default getLLMResponse;
