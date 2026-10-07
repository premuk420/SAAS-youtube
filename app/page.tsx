'use client';
import { useState } from 'react';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      setResult(data.output);
    } catch (error) {
      setResult('Chyba při generování.');
    }
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">YouTube AI Automatizace</h1>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Zadej téma videa (např. Recenze Audi A4 B6)..."
          className="p-3 border rounded text-black"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generuji...' : 'Vygenerovat scénář'}
        </button>
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-black whitespace-pre-wrap">
            {result}
          </div>
        )}
      </div>
    </main>
  );
}