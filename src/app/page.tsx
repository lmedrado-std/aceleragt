
'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(data.status));
  }, []);

  return (
    <main>
      <h1>Status do Banco de Dados</h1>
      <p>O status da conexão com o banco de dados é: {status}</p>
    </main>
  );
}

