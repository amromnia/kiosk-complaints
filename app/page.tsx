'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login by default
    router.push('/login');
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
      <div className="spinner spinner-dark spinner-lg"></div>
    </div>
  );
}

