import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Map() {
  const qc = useQueryClient();
  const [userPos, setUserPos] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSpot, setNewSpot] = useState({ name: '', water_type: 'see', notes: '' });
  const { data } = useQuery({ queryKey: ['spots'], queryFn: () => api.get('/api/spots') });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => setUserPos({ lat: p.coords.latitude, lon: p.coords.longitude }), () => {});
  }, []);

  const add = useMutation({ mutationFn: body => api.post('/api/spots', body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['spots'] }); setShowAdd(false); toast.success('Spot gespeichert!'); } });
  const del = useMutation({ mutationFn: id => api.delete(`/api/spots/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['spots'] }) });
  const spots = data?.spots || [];

  return <div className='p-4 text-white space-y-3'><h1 className='text-xl font-bold'>Angelplätze ({spots.length})</h1><button onClick={()=>setShowAdd(!showAdd)} className='px-3 py-2 bg-cyan-600 rounded'><Plus size={14}/> Spot hinzufügen</button>{showAdd && <button onClick={()=>add.mutate({...newSpot, latitude:userPos?.lat, longitude:userPos?.lon})}>Aktuellen Standort speichern</button>}{spots.map(s=><div key={s.id} className='bg-gray-900 p-3 rounded flex justify-between'><div><MapPin size={14}/>{s.name}</div><button onClick={()=>del.mutate(s.id)}><Trash2 size={14}/></button></div>)}</div>;
}
