
'use client';
import { useEffect } from 'react';
export default function Error({ error, reset }){
  useEffect(()=>{ console.error('App error boundary:', error); }, [error]);
  return (
    <div className="p-6 max-w-sm mx-auto text-white">
      <h2 className="text-xl font-bold mb-2">Une erreur est survenue</h2>
      <p className="text-sm opacity-80 mb-4">{String(error?.message||error||'Erreur inconnue')}</p>
      <button className="px-4 py-2 rounded-xl" style={{background:'#1f85ff'}} onClick={()=>reset()}>Recharger</button>
    </div>
  );
}
