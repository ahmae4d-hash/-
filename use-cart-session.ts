import { useState, useEffect } from 'react';

export function useCartSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('cart_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('cart_session_id', id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
