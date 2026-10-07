'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  topic: string;
  status: string;
  isShort: boolean;
  scriptDone: boolean;
  audioDone: boolean;
  editDone: boolean;
  scriptContent?: string | null;
  createdAt: string;
}

interface Settings {
  weeklyGoal: number;
  channelName: string;
  hasOpenaiKey: boolean;
}

// ─── Shared style tokens ───────────────────────────────────────────────────
const s = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '20px',
  } as React.CSSProperties,

  label: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  } as React.CSSProperties,

  stat: {
    fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)',
    lineHeight: 1.1, marginTop: '4px',
  } as React.CSSProperties,

  tag: (color: string) => ({
    display: 'inline-flex', alignItems: 'center',
    fontSize: '11px', fontWeight: 500,
    padding: '2px 8px', borderRadius: '20px',
    border: `1px solid ${color}22`,
    background: `${color}10`, color,
  }) as React.CSSProperties,

  btn: {
    primary: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '8px 16px', borderRadius: '7px',
      background: 'var(--text-primary)', color: 'white',
      fontSize: '13px', fontWeight: 600, textDecoration: 'none',
      border: 'none', cursor: 'pointer', transition: 'opacity 0.15s',
    } as React.CSSProperties,
    secondary: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '8px 14px', borderRadius: '7px',
      background: 'transparent', color: 'var(--text-secondary)',
      fontSize: '13px', fontWeight: 500, textDecoration: 'none',
      border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s',
    } as React.CSSProperties,
  },
};

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({ weeklyGoal: 5, channelName: '', hasOpenaiKey: false });

  useEffect(() => {
    fetch('/api/videos')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setVideos(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => {});
  }, []);

  const completed = videos.filter((v) => v.scriptDone && v.audioDone && v.editDone);
  const inProgress = videos.filter((v) => !(v.scriptDone && v.audioDone && v.editDone));
  const shorts = videos.filter((v) => v.isShort).length;

  const pipeline = {
    ideas:      videos.filter((v) => !v.scriptDone).length,
    scripted:   videos.filter((v) => v.scriptDone && !v.audioDone).length,
    audioReady: videos.filter((v) => v.audioDone && !v.editDone).length,
    ready:      completed.length,
  };

  const startOfWeek = (() => {
    const d = new Date(); const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff)); mon.setHours(0, 0, 0, 0); return mon;
  })();
  const thisWeek = videos.filter((v) => new Date(v.createdAt) >= startOfWeek).length;
  const weekPct = Math.min(100, Math.round((thisWeek / settings.weeklyGoal) * 100));

  const hoursaved = (videos.length * 3.5).toFixed(0);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            {settings.channelName || 'AI YouTube Studio'}
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Přehled
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Produkce, pipeline a statistiky kanálu.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/topics" style={s.btn.secondary}>Hledat témata</Link>
          <Link href="/script" style={s.btn.secondary}>Nový scénář</Link>
          <Link href="/videos" style={s.btn.primary}>+ Přidat video</Link>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Celkem projektů', value: loading ? '–' : String(videos.length), sub: `${shorts} Shorts · ${videos.length - shorts} Dlouhá` },
          { label: 'V produkci', value: loading ? '–' : String(inProgress.length), sub: inProgress.length > 0 ? 'Rozpracováno' : 'Vše hotové' },
          { label: 'Hotovo k vydání', value: loading ? '–' : String(completed.length), sub: 'Připraveno' },
          { label: 'Ušetřený čas', value: `~${hoursaved}h`, sub: 'Díky AI generování' },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.label}>{c.label}</div>
            <div style={s.stat}>{c.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Týdenní cíl */}
      <div style={{ ...s.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={s.label}>Týdenní cíl</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {thisWeek} z {settings.weeklyGoal} videí tento týden
            </div>
          </div>
          <Link href="/settings" style={{ fontSize: '12px', color: 'var(--indigo)', textDecoration: 'none', fontWeight: 500 }}>
            Upravit →
          </Link>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '99px', transition: 'width 0.5s ease',
            width: `${weekPct}%`,
            background: weekPct >= 100 ? '#16a34a' : weekPct >= 60 ? '#4f46e5' : '#d97706',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>{weekPct >= 100 ? '🎉 Cíl splněn!' : `${weekPct}% splněno`}</span>
          <span>Zbývá {Math.max(0, settings.weeklyGoal - thisWeek)} videí</span>
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ ...s.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={s.label}>Produkční pipeline</div>
          <Link href="/videos" style={{ fontSize: '12px', color: 'var(--indigo)', textDecoration: 'none', fontWeight: 500 }}>Správa →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {[
            { step: '1', label: 'Čeká na scénář', count: pipeline.ideas },
            { step: '2', label: 'Čeká na dabing', count: pipeline.scripted },
            { step: '3', label: 'Čeká na střih', count: pipeline.audioReady },
            { step: '4', label: 'Hotovo', count: pipeline.ready },
          ].map((p, i) => (
            <div key={i} style={{ background: 'var(--surface)', padding: '16px 14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '6px' }}>
                KROK {p.step}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: i === 3 ? '#16a34a' : 'var(--text-primary)' }}>
                {p.count}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rozpracovaná videa */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={s.label}>Rozpracované projekty</div>
            <Link href="/videos" style={{ fontSize: '12px', color: 'var(--indigo)', textDecoration: 'none', fontWeight: 500 }}>
              Všechny ({inProgress.length}) →
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>Načítám…</div>
          ) : inProgress.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inProgress.slice(0, 5).map((v) => {
                const needsScript = !v.scriptDone;
                const needsAudio = v.scriptDone && !v.audioDone;
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={s.tag(v.isShort ? '#dc2626' : '#4f46e5')}>{v.isShort ? 'Shorts' : 'Video'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.topic}</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.title}
                      </div>
                    </div>
                    <Link
                      href={needsScript ? `/script?videoId=${v.id}&title=${encodeURIComponent(v.title)}&format=${v.isShort ? 'shorts' : 'long'}` : '/videos'}
                      style={{ ...s.btn.secondary, flexShrink: 0, fontSize: '12px', padding: '6px 12px' }}
                    >
                      {needsScript ? 'Napsat scénář' : needsAudio ? 'Audio →' : 'Střih →'}
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Žádné rozpracované projekty.{' '}
              <Link href="/topics" style={{ color: 'var(--indigo)', textDecoration: 'none' }}>Hledat témata →</Link>
            </div>
          )}
        </div>

        {/* Pravý sloupec */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Publikační plán */}
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom: '12px' }}>Plán publikování</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { type: 'Shorts', freq: 'Každý den' },
                { type: 'Dlouhé video', freq: 'St & Ne' },
              ].map((p) => (
                <div key={p.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{p.type}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    {p.freq}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stav systému */}
          <div style={s.card}>
            <div style={{ ...s.label, marginBottom: '12px' }}>Stav systému</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Databáze', ok: true },
                { name: 'AI Engine', ok: true },
                { name: 'OpenAI API', ok: settings.hasOpenaiKey },
              ].map((sys) => (
                <div key={sys.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sys.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: sys.ok ? '#16a34a' : '#d97706' }}>
                    {sys.ok ? 'Online' : 'Fallback'}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/settings" style={{ display: 'block', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Nastavení →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}