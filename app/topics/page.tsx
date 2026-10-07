'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface TopicIdea {
  title: string;
  format: 'shorts' | 'long';
  viralScore: number;
  hook: string;
  angle: string;
  tags: string[];
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '10px 20px', borderRadius: '7px',
  background: '#18181b', color: 'white',
  fontSize: '13px', fontWeight: 600,
  border: 'none', cursor: 'pointer',
};

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e4e4e7', borderRadius: '10px', padding: '20px',
};

export default function TopicsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TopicIdea[]>([]);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());

  const quickCategories = [
    'AI nástroje & Automatizace',
    'Osobní finance & Pasivní příjem',
    'Produktivita & Time management',
    'Tech recenze & Gadgety',
    'Fitness & Zdravá výživa',
    'Zajímavosti ze světa a vědy',
  ];

  const searchTrends = async (customNiche?: string) => {
    const target = (customNiche || niche).trim();
    if (!target) { showToast('Zadejte oblast zájmu', 'warning'); return; }
    if (customNiche) setNiche(customNiche);
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'topics', topic: target }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.topics)) {
        setResults(data.topics);
        showToast(`${data.topics.length} nápadů nalezeno`, 'success');
      } else {
        showToast(data.error || 'Chyba při generování', 'error');
      }
    } catch {
      showToast('Chyba připojení', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (topic: TopicIdea) => {
    try {
      const res = await fetch('/api/videos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: topic.title, topic: niche || 'YouTube Trendy', isShort: topic.format === 'shorts', status: 'NÁPAD' }),
      });
      if (res.ok) {
        setSavedTitles((prev) => new Set(prev).add(topic.title));
        showToast('Přidáno do fronty videí', 'success');
      }
    } catch { showToast('Chyba při ukládání', 'error'); }
  };

  const handleGoToScript = (topic: TopicIdea) => {
    router.push(`/script?${new URLSearchParams({ title: topic.title, topic: niche || topic.title, format: topic.format })}`);
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '36px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#18181b', margin: 0, letterSpacing: '-0.02em' }}>
          Hledat témata
        </h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>
          AI analýza virálních témat a mezer v obsahu pro váš kanál.
        </p>
      </div>

      {/* Search */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#52525b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Oblast zájmu (nika)
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchTrends()}
            placeholder="Např. AI automatizace, investování, fitness…"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '7px',
              border: '1px solid #e4e4e7', fontSize: '14px',
              color: '#18181b', outline: 'none', background: '#fafafa',
            }}
          />
          <button
            onClick={() => searchTrends()}
            disabled={loading || !niche.trim()}
            style={{ ...btnPrimary, opacity: loading || !niche.trim() ? 0.5 : 1, minWidth: '120px', justifyContent: 'center' }}
          >
            {loading ? 'Hledám…' : '↗ Hledat'}
          </button>
        </div>

        {/* Quick categories */}
        <div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '8px', fontWeight: 500 }}>Populární niky:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {quickCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => searchTrends(cat)}
                style={{
                  padding: '5px 12px', borderRadius: '20px', border: '1px solid #e4e4e7',
                  background: '#fafafa', fontSize: '12px', color: '#52525b', cursor: 'pointer',
                  fontWeight: 500, transition: 'border-color 0.1s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Výsledky — {results.length} nápadů
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.map((topic, i) => {
              const isSaved = savedTitles.has(topic.title);
              return (
                <div key={i} style={{ ...card, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                          background: topic.format === 'shorts' ? '#fef2f2' : '#eef2ff',
                          color: topic.format === 'shorts' ? '#dc2626' : '#4f46e5',
                          border: `1px solid ${topic.format === 'shorts' ? '#fecaca' : '#c7d2fe'}`,
                        }}>
                          {topic.format === 'shorts' ? 'Shorts' : 'Dlouhé video'}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                          {topic.viralScore}% virální
                        </span>
                        {topic.tags?.slice(0, 2).map((tag, ti) => (
                          <span key={ti} style={{ fontSize: '11px', color: '#a1a1aa', padding: '2px 6px', background: '#fafafa', borderRadius: '20px', border: '1px solid #e4e4e7' }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#18181b', margin: '0 0 10px', lineHeight: 1.4 }}>
                        {topic.title}
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '7px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Hook</div>
                          <div style={{ fontSize: '12px', color: '#52525b', fontStyle: 'italic', lineHeight: 1.5 }}>&ldquo;{topic.hook}&rdquo;</div>
                        </div>
                        <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '7px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Úhel</div>
                          <div style={{ fontSize: '12px', color: '#52525b', lineHeight: 1.5 }}>{topic.angle}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleSave(topic)}
                        disabled={isSaved}
                        style={{
                          padding: '7px 14px', borderRadius: '7px', border: '1px solid #e4e4e7',
                          background: isSaved ? '#f0fdf4' : '#fafafa',
                          color: isSaved ? '#16a34a' : '#52525b',
                          fontSize: '12px', fontWeight: 600, cursor: isSaved ? 'default' : 'pointer',
                        }}
                      >
                        {isSaved ? '✓ Uloženo' : '+ Přidat'}
                      </button>
                      <button
                        onClick={() => handleGoToScript(topic)}
                        style={{ ...btnPrimary, padding: '7px 14px', fontSize: '12px', justifyContent: 'center' }}
                      >
                        Psát scénář →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#a1a1aa' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💡</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#52525b', marginBottom: '6px' }}>Zatím žádné výsledky</div>
          <div style={{ fontSize: '13px' }}>Zadejte niku svého kanálu a klikněte na Hledat.</div>
          <button
            onClick={() => searchTrends('AI nástroje & Automatizace')}
            style={{ ...btnPrimary, marginTop: '16px', background: 'transparent', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '8px 16px' }}
          >
            Vyzkoušet: AI nástroje →
          </button>
        </div>
      )}
    </div>
  );
}