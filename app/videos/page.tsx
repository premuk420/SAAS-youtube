'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

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
  youtubeUrl?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

// ─── Modal pro potvrzení smazání ───────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-xl border border-zinc-200 shadow-xl p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-zinc-900 text-base">{title}</h3>
          <p className="text-zinc-500 text-sm mt-1">{message}</p>
        </div>
        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Smazat
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal pro YouTube URL a publikaci ────────────────────────────────────────
function PublishModal({
  video,
  onSave,
  onClose,
}: {
  video: Video;
  onSave: (id: string, youtubeUrl: string, publishedAt: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(video.youtubeUrl || '');
  const [date, setDate] = useState(
    video.publishedAt
      ? new Date(video.publishedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-xl border border-zinc-200 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 text-base">Označit jako publikované</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 text-sm"
          >
            ✕
          </button>
        </div>
        <p className="text-zinc-500 text-xs truncate font-medium">{video.title}</p>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              YouTube URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              Datum zveřejnění
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={() => onSave(video.id, url, date)}
            className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Uložit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideosPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulář pro nové video
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newIsShort, setNewIsShort] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtry & Hledání
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in_progress' | 'completed' | 'shorts' | 'long'>('all');

  // Modaly
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [publishVideo, setPublishVideo] = useState<Video | null>(null);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      if (Array.isArray(data)) setVideos(data);
    } catch {
      showToast('Chyba při načítání videí', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Přidání nového videa
  const handleAddVideo = async (andWriteScript = false) => {
    if (!newTitle.trim()) {
      showToast('Zadejte prosím název videa', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          topic: newTopic.trim() || 'Vlastní nápad',
          isShort: newIsShort,
          status: 'NÁPAD',
        }),
      });

      const created = await res.json();
      if (res.ok && created.id) {
        setVideos([created, ...videos]);
        setNewTitle('');
        setNewTopic('');
        setShowAddForm(false);
        showToast('Video bylo přidáno do fronty', 'success');

        if (andWriteScript) {
          router.push(`/script?videoId=${created.id}&title=${encodeURIComponent(created.title)}&format=${created.isShort ? 'shorts' : 'long'}`);
        }
      } else {
        showToast(created.error || 'Nepodařilo se přidat video', 'error');
      }
    } catch {
      showToast('Chyba při ukládání videa', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checklist toggle
  const toggleTask = async (id: string, field: 'scriptDone' | 'audioDone' | 'editDone', currentValue: boolean) => {
    const newValue = !currentValue;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, [field]: newValue };
          if (updated.scriptDone && updated.audioDone && updated.editDone) {
            updated.status = 'HOTOVO';
          }
          return updated;
        }
        return v;
      })
    );

    try {
      await fetch('/api/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value: newValue }),
      });
      showToast(`Stav úkolu aktualizován`, 'info');
    } catch {
      showToast('Chyba při synchronizaci se serverem', 'error');
      fetchVideos();
    }
  };

  // Status update
  const updateStatus = async (id: string, newStatus: string) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v)));
    try {
      await fetch('/api/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field: 'status', value: newStatus }),
      });
      showToast(`Stav změněn na: ${newStatus}`, 'success');
    } catch {
      showToast('Chyba při ukládání stavu', 'error');
    }
  };

  // Smazání
  const confirmDelete = async () => {
    if (!deleteVideoId) return;
    const id = deleteVideoId;
    setDeleteVideoId(null);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    try {
      const res = await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) showToast('Projekt byl smazán', 'info');
    } catch {
      showToast('Chyba při mazání videa', 'error');
      fetchVideos();
    }
  };

  // Uložit YouTube URL + datum
  const handleSavePublish = async (id: string, youtubeUrl: string, publishedAtDate: string) => {
    setPublishVideo(null);
    try {
      const res = await fetch('/api/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          youtubeUrl: youtubeUrl || null,
          publishedAt: publishedAtDate ? new Date(publishedAtDate).toISOString() : null,
          status: 'HOTOVO',
          scriptDone: true,
          audioDone: true,
          editDone: true,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVideos((prev) => prev.map((v) => (v.id === id ? updated : v)));
        showToast('Video označeno jako publikované', 'success');
      }
    } catch {
      showToast('Chyba při ukládání', 'error');
    }
  };

  // Filtrace
  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.topic.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isComplete = video.scriptDone && video.audioDone && video.editDone;
    if (filterType === 'in_progress') return !isComplete;
    if (filterType === 'completed') return isComplete;
    if (filterType === 'shorts') return video.isShort;
    if (filterType === 'long') return !video.isShort;
    return true;
  });

  const completedCount = videos.filter((v) => v.scriptDone && v.audioDone && v.editDone).length;
  const inProgressCount = videos.length - completedCount;
  const shortsCount = videos.filter((v) => v.isShort).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Hlavička */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Produkce videí</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Přehled projektů v pipeline: od nápadu přes scénář až po publikování.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showAddForm ? '✕ Zavřít' : '+ Nové video'}</span>
        </button>
      </div>

      {/* Metriky */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">Celkem v pipeline</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1 block">{videos.length}</span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block">V produkci</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1 block">{inProgressCount}</span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 block">Dokončeno</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1 block">{completedCount}</span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">Shorts formát</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1 block">{shortsCount}</span>
        </div>
      </div>

      {/* Formulář pro přidání */}
      {showAddForm && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs mb-8 animate-slide-in">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Přidat nový projekt</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="new-video-title" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Název videa
              </label>
              <input
                id="new-video-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Např. 5 AI nástrojů, které vám ušetří 10 hodin týdně"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="new-video-topic" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Téma / Kategorie
              </label>
              <input
                id="new-video-topic"
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Např. AI nástroje, Finance, Produktivita"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-600">Formát:</span>
              <button
                type="button"
                onClick={() => setNewIsShort(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  !newIsShort
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                Dlouhé video (16:9)
              </button>
              <button
                type="button"
                onClick={() => setNewIsShort(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  newIsShort
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                Shorts (9:16)
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleAddVideo(false)}
                disabled={isSubmitting || !newTitle.trim()}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Jen přidat do fronty
              </button>
              <button
                onClick={() => handleAddVideo(true)}
                disabled={isSubmitting || !newTitle.trim()}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                Přidat a psát scénář →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Filtry & Hledání */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: `Vše (${videos.length})` },
            { id: 'in_progress', label: `V produkci (${inProgressCount})` },
            { id: 'completed', label: `Hotovo (${completedCount})` },
            { id: 'shorts', label: `Shorts (${shortsCount})` },
            { id: 'long', label: `Dlouhá (${videos.length - shortsCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === f.id
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat projekt..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-900 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Seznam videí */}
      {loading ? (
        <div className="text-center py-20 text-zinc-400">
          <div className="inline-block w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Načítám projekty...</p>
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="space-y-3">
          {filteredVideos.map((video) => {
            const completedTasks = (video.scriptDone ? 1 : 0) + (video.audioDone ? 1 : 0) + (video.editDone ? 1 : 0);
            const progressPercent = Math.round((completedTasks / 3) * 100);
            const isPublished = !!video.publishedAt;

            return (
              <div
                key={video.id}
                className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-5 shadow-xs transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-5"
              >
                {/* Info o videu */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        video.isShort
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {video.isShort ? 'Shorts' : 'Dlouhé video'}
                    </span>

                    <span className="text-[11px] text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200">
                      {video.topic}
                    </span>

                    <select
                      value={video.status}
                      onChange={(e) => updateStatus(video.id, e.target.value)}
                      className="text-[11px] font-medium bg-white border border-zinc-300 text-zinc-800 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                    >
                      <option value="NÁPAD">NÁPAD</option>
                      <option value="SCÉNÁŘ">SCÉNÁŘ</option>
                      <option value="AUDIO">AUDIO</option>
                      <option value="STŘIH">STŘIH</option>
                      <option value="HOTOVO">HOTOVO</option>
                    </select>

                    <span className="text-[11px] text-zinc-400 font-mono">{progressPercent}%</span>

                    {isPublished && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        Zveřejněno {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('cs-CZ') : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-zinc-900">{video.title}</h3>

                  {video.youtubeUrl && (
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-600 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      ▶ Otevřít na YouTube
                    </a>
                  )}

                  {/* Progress bar */}
                  <div className="w-full max-w-md bg-zinc-100 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        progressPercent === 100 ? 'bg-emerald-600' : 'bg-zinc-900'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Checklist úkolů */}
                <div className="flex flex-wrap items-center gap-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                  {[
                    { field: 'scriptDone' as const, label: 'Scénář', done: video.scriptDone },
                    { field: 'audioDone' as const, label: 'Audio', done: video.audioDone },
                    { field: 'editDone' as const, label: 'Střih', done: video.editDone },
                  ].map(({ field, label, done }) => (
                    <div key={field} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-zinc-200">
                      <input
                        type="checkbox"
                        id={`${field}-${video.id}`}
                        checked={done}
                        onChange={() => toggleTask(video.id, field, done)}
                        className="w-3.5 h-3.5 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300 cursor-pointer"
                      />
                      <label htmlFor={`${field}-${video.id}`} className="text-xs text-zinc-700 cursor-pointer select-none">
                        {label}
                      </label>
                      {field === 'scriptDone' && (
                        <Link
                          href={`/script?videoId=${video.id}&title=${encodeURIComponent(video.title)}&format=${video.isShort ? 'shorts' : 'long'}`}
                          className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 ml-0.5 underline"
                        >
                          {video.scriptContent ? 'Upravit' : 'Psát'}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {/* Akce */}
                <div className="flex items-center gap-2 self-end xl:self-center flex-wrap">
                  {video.scriptContent && (
                    <button
                      onClick={() => setPreviewVideo(video)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-medium transition-colors"
                    >
                      Scénář
                    </button>
                  )}

                  <button
                    onClick={() => setPublishVideo(video)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isPublished
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200'
                    }`}
                  >
                    {isPublished ? 'Změnit URL' : 'Zveřejnit'}
                  </button>

                  <Link
                    href={`/script?videoId=${video.id}&title=${encodeURIComponent(video.title)}&format=${video.isShort ? 'shorts' : 'long'}`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
                  >
                    Otevřít editor →
                  </Link>

                  <button
                    onClick={() => setDeleteVideoId(video.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                    title="Smazat video"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-dashed border-zinc-300">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center text-xl mx-auto mb-3">
            🎬
          </div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Žádná videa v tomto zobrazení</h3>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto mb-5">
            Můžete vyhledat trendy nápady pomocí AI generátoru nebo přidat nový projekt přímo.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link
              href="/topics"
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors"
            >
              Hledat témata s AI
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold transition-colors"
            >
              Přidat ručně
            </button>
          </div>
        </div>
      )}

      {/* Modal: Náhled scénáře */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl border border-zinc-200 flex flex-col shadow-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Uložený scénář</span>
                <h3 className="text-base font-semibold text-zinc-900 mt-0.5">{previewVideo.title}</h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap bg-zinc-50">
              {previewVideo.scriptContent}
            </div>
            <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (previewVideo.scriptContent) {
                    navigator.clipboard.writeText(previewVideo.scriptContent);
                    showToast('Scénář zkopírován do schránky', 'success');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium"
              >
                Kopírovat text
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (previewVideo.scriptContent) {
                      const blob = new Blob([previewVideo.scriptContent], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${previewVideo.title.replace(/\s+/g, '_').slice(0, 40)}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('Scénář stažen jako .txt', 'info');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium"
                >
                  Stáhnout .txt
                </button>
                <Link
                  href={`/script?videoId=${previewVideo.id}&title=${encodeURIComponent(previewVideo.title)}&format=${previewVideo.isShort ? 'shorts' : 'long'}`}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold"
                >
                  Otevřít v editoru →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deleteVideoId && (
        <ConfirmModal
          title="Smazat projekt"
          message="Tato akce je nevratná. Odstraní projekt i uložený scénář z databáze."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteVideoId(null)}
        />
      )}

      {/* Modal: Publikování */}
      {publishVideo && (
        <PublishModal
          video={publishVideo}
          onSave={handleSavePublish}
          onClose={() => setPublishVideo(null)}
        />
      )}
    </div>
  );
}