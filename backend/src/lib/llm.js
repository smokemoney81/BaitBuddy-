const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';
const LLAMACPP_URL = process.env.LLAMACPP_URL || 'http://127.0.0.1:8080';
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 30000);

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
}

function parseImage(imageBase64) {
  if (!imageBase64) return null;
  const [header, data] = imageBase64.split(',');
  const mediaType = header?.match(/:(.*?);/)?.[1] || 'image/jpeg';
  return { mediaType, data };
}

async function invokeOllama({ prompt, imageBase64 = null }) {
  const { controller, timeout } = withTimeout(TIMEOUT_MS);
  try {
    const body = {
      model: OLLAMA_MODEL,
      stream: false,
      messages: [{ role: 'user', content: prompt }]
    };

    if (imageBase64) {
      const parsed = parseImage(imageBase64);
      if (parsed?.data) {
        body.messages[0].images = [parsed.data];
      }
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    return data?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

async function invokeLlamaCpp({ prompt }) {
  const { controller, timeout } = withTimeout(TIMEOUT_MS);
  try {
    const response = await fetch(`${LLAMACPP_URL}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        n_predict: 256,
        temperature: 0.5,
        stop: ['</s>']
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`llama.cpp HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    return (data?.content || '').trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function invokeLLM({ prompt, imageBase64 = null }) {
  try {
    const ollamaReply = await invokeOllama({ prompt, imageBase64 });
    if (ollamaReply) return ollamaReply;
  } catch (ollamaError) {
    if (process.env.LLM_DEBUG === '1') {
      console.warn(`[LLM] Ollama failed: ${ollamaError.message}`);
    }
  }

  const fallback = await invokeLlamaCpp({ prompt });
  if (!fallback) {
    throw new Error('LLM antwortet nicht (Ollama und llama.cpp fehlgeschlagen).');
  }
  return fallback;
}
