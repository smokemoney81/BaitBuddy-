import { useState } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Community() {
  const qc = useQueryClient();
  const [selectedComp, setSelectedComp] = useState(null);
  const { data: comps } = useQuery({ queryKey: ['competitions'], queryFn: () => api.get('/api/competitions') });
  const { data: leaderboard } = useQuery({ queryKey: ['leaderboard', selectedComp], queryFn: () => api.get(`/api/competitions/${selectedComp}/leaderboard`), enabled: !!selectedComp });
  const like = useMutation({ mutationFn: id => api.post(`/api/submissions/${id}/like`, {}), onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaderboard'] }); toast.success('Geliked!'); } });
  const competitions = comps?.competitions || [];
  const board = leaderboard?.leaderboard || [];
  return <div className='p-4 text-white'><h1>Community</h1>{competitions.map(c=><button key={c.id} onClick={()=>setSelectedComp(c.id)}>{c.title}</button>)}{board.map(e=><button key={e.id} onClick={()=>like.mutate(e.id)}>{e.species}</button>)}</div>;
}
