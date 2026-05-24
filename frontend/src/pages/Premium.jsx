import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';

export default function Premium() {
  const { data } = useQuery({ queryKey: ['plan'], queryFn: () => api.post('/api/plan/status', {}) });
  const currentPlan = data?.plan;
  return <div className='p-4 text-white'><h1>Premium</h1><p>Aktuell: {currentPlan?.name || 'Free'}</p></div>;
}
