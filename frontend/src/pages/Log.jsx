import { useState } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Trash2 } from 'lucide-react';

const SPECIES = ['Hecht', 'Zander', 'Barsch', 'Karpfen', 'Forelle', 'Schleie', 'Aal', 'Wels', 'Sonstige'];

export default function Log() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ species: '', length_cm: '', weight_kg: '', bait_used: '', notes: '', is_released: false });

  const { data } = useQuery({ queryKey: ['catches'], queryFn: () => api.get('/api/catches') });

  const add = useMutation({
    mutationFn: body => api.post('/api/catches', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catches'] }); setShowForm(false); toast.success('Fang eingetragen!'); }
  });

  const del = useMutation({
    mutationFn: id => api.delete(`/api/catches/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catches'] }); toast.success('Gelöscht'); }
  });

  const catches = data?.catches || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Fangbuch ({catches.length})</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-medium">
          <Plus size={16} /> Fang eintragen
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
          <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-white">Neuer Fang</h2><button onClick={() => setShowForm(false)}><X className="text-gray-400" size={20} /></button></div>
            <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white"><option value="">Fischart wählen</option>{SPECIES.map(s => <option key={s}>{s}</option>)}</select>
            <button onClick={() => add.mutate({ ...form, catch_time: new Date().toISOString() })} disabled={!form.species || add.isPending} className="w-full py-3 rounded-xl bg-cyan-600 text-white">Fang eintragen</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {catches.map(c => (
          <div key={c.id} className="rounded-2xl bg-gray-900/80 p-4 border border-gray-800 flex justify-between items-start">
            <div><p className="font-semibold text-white">{c.species || 'Unbekannt'}</p><p className="text-gray-400 text-sm mt-1">{c.length_cm && `${c.length_cm}cm`} {c.weight_kg && `· ${c.weight_kg}kg`}</p></div>
            <button onClick={() => del.mutate(c.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
