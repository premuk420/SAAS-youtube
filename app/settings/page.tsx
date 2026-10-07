'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const { showToast } = useToast();

  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [channelName, setChannelName] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setWeeklyGoal(data.weeklyGoal ?? 5);
        setChannelName(data.channelName ?? '');
        setHasOpenaiKey(data.hasOpenaiKey ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = { weeklyGoal, channelName };
      if (openaiKey.trim()) payload.openaiKey = openaiKey.trim();

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setHasOpenaiKey(data.hasOpenaiKey);
        setOpenaiKey('');
        showToast('Nastavení bylo úspěšně uloženo', 'success');
      } else {
        showToast('Chyba při ukládání nastavení', 'error');
      }
    } catch {
      showToast('Chyba síťového připojení', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <div className="inline-block w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Načítám nastavení...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Nastavení studia</h1>
        <p className="text-sm text-zinc-500 mt-1">Konfigurace parametrů kanálu, produkčního plánu a AI modelu.</p>
      </div>

      <div className="space-y-6">
        {/* Informace o kanálu */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">Profil kanálu</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Základní údaje zobrazované v dashboardu a generátoru.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="channel-name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Název YouTube kanálu
              </label>
              <input
                id="channel-name"
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Např. Tech s Karlem"
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
              />
              <p className="text-xs text-zinc-500 mt-1.5">Používá se pro personalizaci generovaného obsahu a zobrazení v záhlaví.</p>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="weekly-goal" className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Týdenní produkční cíl
                </label>
                <span className="text-base font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-md">
                  {weeklyGoal} {weeklyGoal === 1 ? 'video' : weeklyGoal < 5 ? 'videa' : 'videí'} / týden
                </span>
              </div>
              <input
                id="weekly-goal"
                type="range"
                min={1}
                max={21}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                className="w-full accent-zinc-900 h-2 bg-zinc-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 mt-1.5 font-medium">
                <span>1 video (volné tempo)</span>
                <span>7 videí (denní obsah)</span>
                <span>21 videí (plná automatizace)</span>
              </div>
            </div>
          </div>
        </section>

        {/* OpenAI integrace */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">OpenAI API</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Napojení pro generování přes model GPT-4o-mini.</p>
            </div>
            {hasOpenaiKey ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktivní
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Smart Fallback
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="openai-key" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                API Klíč
              </label>
              <div className="relative">
                <input
                  id="openai-key"
                  type={showKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={hasOpenaiKey ? '•••••••••••••••••••••••••••••••• (klíč je bezpečně uložen)' : 'sk-proj-...'}
                  className="w-full px-3.5 py-2.5 pr-20 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors"
                >
                  {showKey ? 'Skrýt' : 'Zobrazit'}
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Klíč je uložen pouze ve vaší lokální SQLite databázi a je odesílán výhradně na servery OpenAI. Pokud klíč nezadáte, aplikace generuje data v inteligentním demo režimu.
            </p>
          </div>
        </section>

        {/* Akce */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ukládám...</span>
              </>
            ) : (
              <span>Uložit změny</span>
            )}
          </button>
        </div>

        {/* Systémové info */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-500 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-700 font-medium">
            <span>ℹ️</span>
            <span>Systémové informace</span>
          </div>
          <p>• Databáze: SQLite lokální úložiště (`prisma/dev.db`)</p>
          <p>• Šifrování: API klíče nejsou sdíleny s žádnou třetí stranou mimo OpenAI</p>
          <p>• Verze studia: v1.0 Production Ready</p>
        </div>
      </div>
    </div>
  );
}
