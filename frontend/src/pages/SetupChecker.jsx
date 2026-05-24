import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

const statusStyles = {
  ok: 'text-emerald-300 border-emerald-600/30 bg-emerald-900/20',
  fail: 'text-rose-300 border-rose-600/30 bg-rose-900/20'
};

const labels = {
  backend: 'Backend API',
  lowRamMode: 'Low RAM Mode',
  ollama: 'Ollama',
  llamaCpp: 'llama.cpp',
  supabaseEnv: 'Supabase ENV'
};

export default function SetupChecker() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['setup-check'],
    queryFn: () => api.get('/api/setup-check')
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Setup Checker</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-3 py-2 text-sm rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
        >
          Neu prüfen
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Prüfe lokale Services…</p>}
      {error && <p className="text-rose-400">Fehler: {error.message}</p>}

      {data && (
        <>
          <div className={`rounded-xl border p-4 ${data.ok ? statusStyles.ok : statusStyles.fail}`}>
            <p className="font-semibold">Gesamtstatus: {data.ok ? 'BEREIT' : 'NICHT BEREIT'}</p>
            <p className="text-sm mt-1 opacity-90">{data.advice}</p>
          </div>

          <div className="space-y-3">
            {Object.entries(data.checks || {}).map(([name, check]) => (
              <div key={name} className={`rounded-xl border p-4 ${check.ok ? statusStyles.ok : statusStyles.fail}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{labels[name] || name}</p>
                  <p className="text-xs font-bold">{check.ok ? 'OK' : 'FEHLT'}</p>
                </div>
                <p className="text-sm mt-1 opacity-90">{check.detail}</p>
                <p className="text-xs mt-2 opacity-70">{check.required ? 'Pflichtcheck' : 'Optionaler Check'}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500">Stand: {new Date(data.timestamp).toLocaleString('de-DE')}</p>
        </>
      )}
    </div>
  );
}
