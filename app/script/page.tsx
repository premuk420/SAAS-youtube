'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface ThumbnailConcept {
  headline: string;
  visualConcept: string;
  colorScheme: string;
  emotion: string;
  clickbaitLevel: number;
}

// ─── Shared mini-styles ────────────────────────────────────────────────────
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e4e4e7', borderRadius: '10px', padding: '20px' };
const label: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' };
const input: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '7px',
  border: '1px solid #e4e4e7', fontSize: '14px', color: '#18181b',
  outline: 'none', background: '#fafafa', fontFamily: 'inherit', boxSizing: 'border-box',
};
const textarea: React.CSSProperties = {
  ...input, resize: 'none', fontFamily: 'ui-monospace, monospace', fontSize: '13px', lineHeight: '1.6',
};
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '9px 18px', borderRadius: '7px', background: '#18181b', color: 'white',
  fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', width: '100%',
};
const btnSecondary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '8px 14px', borderRadius: '7px', background: '#fafafa', color: '#52525b',
  fontSize: '12px', fontWeight: 500, border: '1px solid #e4e4e7', cursor: 'pointer',
};

function Spinner() {
  return (
    <svg className="animate-spin" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity={0.25} />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity={0.75} />
    </svg>
  );
}

function ScriptStudioContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState<'shorts' | 'long'>('long');
  const [tone, setTone] = useState('Poutavý & Energický');
  const [audience, setAudience] = useState('Široká veřejnost');
  const [videoId, setVideoId] = useState<string | null>(null);

  const [scriptContent, setScriptContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'assets'>('editor');
  const [humanizeStyle, setHumanizeStyle] = useState<'natural' | 'punchy' | 'conversational'>('natural');

  const [thumbnails, setThumbnails] = useState<ThumbnailConcept[]>([]);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionTags, setDescriptionTags] = useState<string[]>([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  useEffect(() => {
    const urlTitle = searchParams.get('title');
    const urlTopic = searchParams.get('topic');
    const urlFormat = searchParams.get('format');
    const urlVideoId = searchParams.get('videoId');

    if (urlTitle) setTopic(urlTitle);
    else if (urlTopic) setTopic(urlTopic);
    if (urlFormat === 'shorts' || urlFormat === 'long') setFormat(urlFormat);

    if (urlVideoId) {
      setVideoId(urlVideoId);
      fetch(`/api/videos?id=${urlVideoId}`).then((r) => r.json()).then((v) => {
        if (v && !v.error) {
          if (v.title) setTopic(v.title);
          if (v.isShort !== undefined) setFormat(v.isShort ? 'shorts' : 'long');
          if (v.scriptContent) setScriptContent(v.scriptContent);
          if (v.thumbnailIdea) { try { setThumbnails(JSON.parse(v.thumbnailIdea)); } catch { /**/ } }
          if (v.descriptionContent) setDescription(v.descriptionContent);
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { showToast('Zadejte téma', 'warning'); return; }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'script', topic, format, tone, audience }) });
      const data = await res.json();
      if (res.ok && data.output) { setScriptContent(data.output); showToast('Scénář vygenerován', 'success'); }
      else showToast(data.error || 'Chyba', 'error');
    } catch { showToast('Chyba připojení', 'error'); }
    finally { setIsGenerating(false); }
  }, [topic, format, tone, audience, showToast]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleGenerate]);

  const handleHumanize = async () => {
    if (!scriptContent.trim()) { showToast('Nejprve vygenerujte scénář', 'warning'); return; }
    setIsHumanizing(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'humanize', scriptContent, humanizeStyle }) });
      const data = await res.json();
      if (res.ok && data.output) { setScriptContent(data.output); showToast('Humanizováno', 'success'); }
      else showToast(data.error || 'Chyba', 'error');
    } catch { showToast('Chyba', 'error'); }
    finally { setIsHumanizing(false); }
  };

  const handleThumbnail = async () => {
    if (!topic.trim()) { showToast('Zadejte název videa', 'warning'); return; }
    setIsGeneratingThumbnail(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'thumbnail', title: topic }) });
      const data = await res.json();
      if (res.ok && data.thumbnails) { setThumbnails(data.thumbnails); setActiveTab('assets'); showToast('Thumbnaily připraveny', 'success'); }
      else showToast(data.error || 'Chyba', 'error');
    } catch { showToast('Chyba', 'error'); }
    finally { setIsGeneratingThumbnail(false); }
  };

  const handleDescription = async () => {
    if (!scriptContent.trim()) { showToast('Nejprve vygenerujte scénář', 'warning'); return; }
    setIsGeneratingDescription(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'description', title: topic, scriptContent }) });
      const data = await res.json();
      if (res.ok && data.description) { setDescription(data.description); setDescriptionTags(data.tags || []); setActiveTab('assets'); showToast('Popis vygenerován', 'success'); }
      else showToast(data.error || 'Chyba', 'error');
    } catch { showToast('Chyba', 'error'); }
    finally { setIsGeneratingDescription(false); }
  };

  const handleSave = async () => {
    if (!scriptContent.trim()) { showToast('Prázdný scénář', 'warning'); return; }
    setIsSaving(true);
    const extra = {
      thumbnailIdea: thumbnails.length > 0 ? JSON.stringify(thumbnails) : undefined,
      descriptionContent: description || undefined,
    };
    try {
      if (videoId) {
        const res = await fetch('/api/videos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: videoId, title: topic, scriptContent, scriptDone: true, isShort: format === 'shorts', status: 'SCÉNÁŘ', ...extra }) });
        if (res.ok) showToast('Uloženo', 'success'); else showToast('Chyba', 'error');
      } else {
        const res = await fetch('/api/videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: topic || 'Nové video', topic: topic || 'YouTube', isShort: format === 'shorts', status: 'SCÉNÁŘ', scriptContent, scriptDone: true, ...extra }) });
        const created = await res.json();
        if (res.ok && created.id) { setVideoId(created.id); showToast('Projekt vytvořen', 'success'); }
        else showToast('Chyba', 'error');
      }
    } catch { showToast('Chyba', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleDownloadTxt = () => {
    if (!scriptContent) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([scriptContent], { type: 'text/plain;charset=utf-8' }));
    a.download = `${(topic || 'scenar').replace(/\s+/g, '_')}.txt`;
    a.click(); showToast('Staženo jako .txt', 'info');
  };

  const insertMarker = (m: string) => setScriptContent((p) => p + `\n${m} `);

  const words = scriptContent.trim() ? scriptContent.trim().split(/\s+/).length : 0;
  const mins = Math.floor((words / 135) * 60 / 60);
  const secs = Math.round((words / 135) * 60) % 60;

  const selectStyle: React.CSSProperties = { ...input, padding: '8px 12px', fontSize: '13px', cursor: 'pointer' };

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '36px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#18181b', margin: 0, letterSpacing: '-0.02em' }}>Scénář & Humanizer</h1>
          <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>
            AI generátor · Humanizer · Thumbnail koncepty · YouTube popis
            {videoId && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace' }}>#{videoId.slice(0, 6)}</span>}
          </p>
        </div>
        <Link href="/videos" style={{ ...btnSecondary, textDecoration: 'none' }}>← Zpět na frontu</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Levý panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Parametry */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#18181b', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Parametry</span>
              <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 500 }}>Ctrl+Enter = generovat</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={label}>Téma / Název</div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Např. 5 největších chyb v AI automatizaci…"
                  rows={3}
                  style={textarea}
                />
              </div>

              <div>
                <div style={label}>Formát</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[{ id: 'shorts', label: 'Shorts', sub: '< 60s' }, { id: 'long', label: 'Dlouhé', sub: '6–10 min' }].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id as 'shorts' | 'long')}
                      style={{
                        padding: '10px 8px', borderRadius: '7px', border: '1px solid',
                        borderColor: format === f.id ? '#4f46e5' : '#e4e4e7',
                        background: format === f.id ? '#eef2ff' : '#fafafa',
                        color: format === f.id ? '#4f46e5' : '#52525b',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <div>{f.label}</div>
                      <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px', opacity: 0.7 }}>{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={label}>Tón</div>
                <select value={tone} onChange={(e) => setTone(e.target.value)} style={selectStyle}>
                  <option value="Poutavý & Energický">Poutavý & Energický</option>
                  <option value="Hloubkový & Expertní">Hloubkový & Edukativní</option>
                  <option value="Kamarádský & Neformální">Kamarádský & Neformální</option>
                  <option value="Dramatický & Storytelling">Dramatický & Storytelling</option>
                  <option value="Úderný & Rychlý">Přímo k věci</option>
                </select>
              </div>

              <div>
                <div style={label}>Publikum</div>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} style={selectStyle}>
                  <option value="Široká veřejnost">Začátečníci & Široká veřejnost</option>
                  <option value="Pokročilí tvůrci a profíci">Profesionálové & Pokročilí</option>
                  <option value="Podnikatelé a freelanceři">Podnikatelé & Tvůrci</option>
                  <option value="Mladá generace (Gen Z)">Mladá generace</option>
                </select>
              </div>

              <button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} style={{ ...btnPrimary, opacity: isGenerating || !topic.trim() ? 0.5 : 1, marginTop: '4px' }}>
                {isGenerating ? <><Spinner /> Generuji…</> : '✦ Vygenerovat scénář'}
              </button>
            </div>
          </div>

          {/* Humanizer */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#18181b', marginBottom: '12px' }}>Humanizer</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '10px' }}>
              {(['natural', 'punchy', 'conversational'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setHumanizeStyle(style)}
                  style={{
                    padding: '6px', borderRadius: '6px', border: '1px solid',
                    borderColor: humanizeStyle === style ? '#4f46e5' : '#e4e4e7',
                    background: humanizeStyle === style ? '#eef2ff' : '#fafafa',
                    color: humanizeStyle === style ? '#4f46e5' : '#52525b',
                    fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {style === 'natural' ? 'Přirozený' : style === 'punchy' ? 'Úderný' : 'Kamarádský'}
                </button>
              ))}
            </div>
            <button onClick={handleHumanize} disabled={isHumanizing || !scriptContent.trim()} style={{ ...btnSecondary, width: '100%', opacity: isHumanizing || !scriptContent.trim() ? 0.5 : 1 }}>
              {isHumanizing ? <><Spinner /> Humanizuji…</> : '🗣 Humanizovat text'}
            </button>
          </div>

          {/* AI Assety */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#18181b', marginBottom: '12px' }}>AI Assety</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={handleThumbnail} disabled={isGeneratingThumbnail || !topic.trim()} style={{ ...btnSecondary, justifyContent: 'flex-start', opacity: isGeneratingThumbnail || !topic.trim() ? 0.5 : 1 }}>
                {isGeneratingThumbnail ? <Spinner /> : '🖼'}
                <span>Thumbnail koncepty</span>
                {thumbnails.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>✓ {thumbnails.length}</span>}
              </button>
              <button onClick={handleDescription} disabled={isGeneratingDescription || !scriptContent.trim()} style={{ ...btnSecondary, justifyContent: 'flex-start', opacity: isGeneratingDescription || !scriptContent.trim() ? 0.5 : 1 }}>
                {isGeneratingDescription ? <Spinner /> : '📋'}
                <span>Description + Tagy</span>
                {description && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>✓</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Pravý panel – Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Toolbar */}
          <div style={{ ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px', background: '#f4f4f5', padding: '3px', borderRadius: '7px' }}>
              {[
                { id: 'editor', label: 'Editor' },
                { id: 'preview', label: 'Teleprompter' },
                { id: 'assets', label: 'Assety', dot: thumbnails.length > 0 || !!description },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  style={{
                    padding: '5px 12px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
                    background: activeTab === t.id ? '#fff' : 'transparent',
                    color: activeTab === t.id ? '#18181b' : '#71717a',
                    boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {t.label}
                  {'dot' in t && t.dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />}
                </button>
              ))}
            </div>

            {/* Metriky + akce */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{words} slov · {mins}m {secs}s</span>
              <button onClick={() => { navigator.clipboard.writeText(scriptContent); showToast('Zkopírováno', 'success'); }} disabled={!scriptContent} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '11px' }}>Kopírovat</button>
              <button onClick={handleDownloadTxt} disabled={!scriptContent} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '11px' }}>.txt</button>
              <button onClick={handleSave} disabled={isSaving || !scriptContent.trim()} style={{ ...btnSecondary, padding: '5px 14px', fontSize: '12px', fontWeight: 600, borderColor: '#16a34a', color: '#16a34a', background: '#f0fdf4', opacity: isSaving || !scriptContent.trim() ? 0.5 : 1 }}>
                {isSaving ? 'Ukládám…' : videoId ? 'Aktualizovat' : 'Uložit'}
              </button>
            </div>
          </div>

          {/* Markers (editor only) */}
          {activeTab === 'editor' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: '[odmlka]', val: '[odmlka]' },
                { label: '[B-ROLL]', val: '[B-ROLL: Záběr na detail]' },
                { label: '[TITULEK]', val: '[TITULEK NA OBRAZOVCE: Text]' },
                { label: '*Důraz*', val: '*(DŮRAZ V HLASU)*' },
              ].map((m) => (
                <button key={m.val} onClick={() => insertMarker(m.val)} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px' }}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Content area */}
          <div style={{ ...card, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'editor' && (
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Scénář se zobrazí zde… nebo vložte vlastní text k humanizaci. (Ctrl+Enter = vygenerovat)"
                style={{ ...textarea, flex: 1, minHeight: '460px', background: 'transparent', border: 'none', padding: 0, outline: 'none' }}
              />
            )}

            {activeTab === 'preview' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ background: '#f4f4f5', borderRadius: '7px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#52525b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🎙 Teleprompter – čtení do kamery</span>
                  <span style={{ color: '#a1a1aa' }}>~130 slov/min</span>
                </div>
                {scriptContent ? (
                  <div style={{ fontSize: '18px', lineHeight: 1.8, color: '#18181b', whiteSpace: 'pre-wrap' }}>
                    {scriptContent.split('\n').map((line, i) =>
                      line.startsWith('[') ? (
                        <div key={i} style={{ fontSize: '12px', fontFamily: 'monospace', color: '#d97706', background: '#fffbeb', padding: '4px 10px', borderRadius: '5px', display: 'inline-block', margin: '4px 0' }}>{line}</div>
                      ) : (
                        <p key={i} style={{ margin: '0 0 12px' }}>{line}</p>
                      )
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#a1a1aa', fontSize: '13px' }}>Nejprve vygenerujte scénář.</div>
                )}
              </div>
            )}

            {activeTab === 'assets' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Thumbnails */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#18181b', marginBottom: '12px' }}>Thumbnail koncepty</div>
                  {thumbnails.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {thumbnails.map((t, i) => (
                        <div key={i} style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase' }}>#{i + 1}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}>CTR {t.clickbaitLevel}/10</span>
                          </div>
                          <div style={{ background: '#18181b', color: 'white', padding: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, textAlign: 'center', marginBottom: '10px', wordBreak: 'break-word' }}>
                            {t.headline}
                          </div>
                          <div style={{ fontSize: '11px', color: '#52525b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div><span style={{ color: '#a1a1aa' }}>Vizuál: </span>{t.visualConcept}</div>
                            <div><span style={{ color: '#a1a1aa' }}>Barvy: </span>{t.colorScheme}</div>
                            <div><span style={{ color: '#a1a1aa' }}>Emoce: </span>{t.emotion}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', background: '#fafafa', borderRadius: '8px', border: '1px dashed #e4e4e7', color: '#a1a1aa', fontSize: '12px' }}>
                      Klikněte na „Thumbnail koncepty" v levém panelu.
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#18181b' }}>YouTube Popis & SEO Tagy</div>
                    {description && (
                      <button onClick={() => { navigator.clipboard.writeText(description + '\n\nTagy: ' + descriptionTags.join(', ')); showToast('Zkopírováno', 'success'); }} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px' }}>
                        Kopírovat vše
                      </button>
                    )}
                  </div>
                  {description ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} style={{ ...textarea, background: '#fafafa' }} />
                      {descriptionTags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {descriptionTags.map((tag, i) => (
                            <span key={i} style={{ fontSize: '11px', padding: '3px 8px', background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: '20px', color: '#52525b', fontFamily: 'monospace' }}>
                              #{typeof tag === 'string' ? tag.replace(/^#/, '') : tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', background: '#fafafa', borderRadius: '8px', border: '1px dashed #e4e4e7', color: '#a1a1aa', fontSize: '12px' }}>
                      Klikněte na „Description + Tagy" v levém panelu.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScriptPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px', color: '#a1a1aa', fontSize: '14px' }}>Načítám…</div>}>
      <ScriptStudioContent />
    </Suspense>
  );
}
