import { Router } from 'express';

const router = Router();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const LLAMACPP_URL = process.env.LLAMACPP_URL || 'http://127.0.0.1:8080';

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

router.get('/setup-check', async (req, res) => {
  const checks = {
    backend: { ok: true, required: true, detail: 'Express API erreichbar.' },
    lowRamMode: {
      ok: true,
      required: false,
      detail: `LOW_RAM_MODE=${parseBoolean(process.env.LOW_RAM_MODE, true) ? 'aktiv' : 'deaktiviert'}.`
    },
    ollama: { ok: false, required: false, detail: 'Nicht geprüft.' },
    llamaCpp: { ok: false, required: false, detail: 'Nicht geprüft.' },
    supabaseEnv: { ok: false, required: true, detail: 'Nicht geprüft.' }
  };

  try {
    const response = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`, {}, 1500);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    checks.ollama = {
      ok: true,
      required: false,
      detail: `Ollama erreichbar (${json?.models?.length ?? 0} Modelle erkannt).`
    };
  } catch (error) {
    checks.ollama = {
      ok: false,
      required: false,
      detail: `Ollama nicht erreichbar: ${error.message}`
    };
  }

  try {
    const response = await fetchWithTimeout(`${LLAMACPP_URL}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'ping', n_predict: 1, temperature: 0 })
    }, 1800);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    checks.llamaCpp = {
      ok: typeof json?.content === 'string',
      required: false,
      detail: typeof json?.content === 'string'
        ? 'llama.cpp Completion-Endpoint erreichbar.'
        : 'llama.cpp antwortet ohne content-Feld.'
    };
  } catch (error) {
    checks.llamaCpp = {
      ok: false,
      required: false,
      detail: `llama.cpp nicht erreichbar: ${error.message}`
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  checks.supabaseEnv = supabaseUrl && supabaseKey
    ? { ok: true, required: true, detail: 'SUPABASE_URL und SUPABASE_ANON_KEY gesetzt.' }
    : { ok: false, required: true, detail: 'SUPABASE_URL oder SUPABASE_ANON_KEY fehlt.' };

  const llmAvailable = checks.ollama.ok || checks.llamaCpp.ok;
  const requiredOk = checks.backend.ok && checks.supabaseEnv.ok;
  const ok = requiredOk && llmAvailable;

  return res.json({
    ok,
    llmAvailable,
    checks,
    advice: llmAvailable
      ? 'Mindestens ein lokaler LLM-Dienst ist bereit.'
      : 'Starte Ollama oder llama.cpp lokal, damit Chat/Analyse funktionieren.',
    timestamp: new Date().toISOString()
  });
});

export default router;
