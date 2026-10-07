import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { topic } = await req.json();

  // Zde bys napojil svůj skript pro YouTube AI automatizaci.
  // Pro ukázku vracíme mockovaná data.
  const aiGeneratedContent = `Vygenerovaný obsah pro téma: ${topic}\n\n1. Úvod: Představení tématu.\n2. Hlavní část: Analýza klíčových bodů.\n3. Závěr: Call to action (Odběr, Like).`;

  return NextResponse.json({ output: aiGeneratedContent });
}