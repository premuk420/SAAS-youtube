import { NextRequest, NextResponse } from 'next/server';

interface TopicIdea {
  title: string;
  format: 'shorts' | 'long';
  viralScore: number;
  hook: string;
  angle: string;
  tags: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = 'script', // 'script' | 'humanize' | 'topics'
      topic = '',
      title = '',
      audience = 'Široká veřejnost',
      format = 'long', // 'shorts' | 'long'
      tone = 'Poutavý & Energický',
      scriptContent = '',
      humanizeStyle = 'natural', // 'natural' | 'conversational' | 'punchy'
    } = body;

    const apiKey = process.env.OPENAI_API_KEY;

    // ==========================================
    // 1. REŽIM: GENERACE TÉMAT (TOPICS)
    // ==========================================
    if (mode === 'topics') {
      const niche = topic || 'Technologie & AI';

      if (apiKey) {
        try {
          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.8,
              messages: [
                {
                  role: 'system',
                  content:
                    'Jsi přední YouTube stratég. Navrhni 5 vysoce virálních témat pro YouTube v zadané oblasti. Odpověz POUZE validním JSON polem objektů: [{"title": string, "format": "shorts" | "long", "viralScore": number (80-99), "hook": string, "angle": string, "tags": string[]}]',
                },
                {
                  role: 'user',
                  content: `Oblast zájmu / nika: ${niche}`,
                },
              ],
            }),
          });

          if (openAiRes.ok) {
            const data = await openAiRes.json();
            const rawContent = data.choices[0]?.message?.content?.trim();
            const cleanJson = rawContent.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json({ topics: parsed });
          }
        } catch (e) {
          console.warn('OpenAI fallback to smart engine:', e);
        }
      }

      // Fallback chytrý generátor s bohatou strukturou témat
      await new Promise((r) => setTimeout(r, 600));

      const generatedTopics: TopicIdea[] = [
        {
          title: `5 brutálních chyb v ${niche}, které ničí vaše výsledky`,
          format: 'long',
          viralScore: 96,
          hook: 'Děláte to pravděpodobně taky a stojí vás to peníze i čas...',
          angle: 'Odhalení skrytých mýtů a praktická náprava krok za krokem.',
          tags: ['#viral', '#tipy', '#tutorial', `#${niche.replace(/\s+/g, '')}`],
        },
        {
          title: `Tohle o ${niche} před vámi experti záměrně tají`,
          format: 'shorts',
          viralScore: 93,
          hook: 'Stop scrollingu! 99 % lidí o tomhle pravidle nemá ani tušení.',
          angle: 'Kontroverzní pohled do zákulisí a rychlé zjištění do 45 sekund.',
          tags: ['#shorts', '#tajemstvi', '#fakta'],
        },
        {
          title: `Kompletní průvodce: Jak ovládnout ${niche} od nuly (Návod 2026)`,
          format: 'long',
          viralScore: 91,
          hook: 'Pokud začínáte dnes, zapomeňte na zastaralé poučky. Tady je moderní plán.',
          angle: 'A-to-Z praktická kuchařka s přesným akčním plánem pro diváka.',
          tags: ['#navod2026', '#jaknato', '#strategie'],
        },
        {
          title: `Otestoval jsem nejpopulárnější nástroje pro ${niche} za vás`,
          format: 'long',
          viralScore: 89,
          hook: 'Ušetřil jsem vám hodiny testování. Který z nich je totální odpad a který klenot?',
          angle: 'Objektivní srovnání a upřímná recenze bez placeného sponzoringu.',
          tags: ['#recenze', '#srovnani', '#doporuceni'],
        },
        {
          title: `3 tajné triky pro ${niche}, které změní všechno`,
          format: 'shorts',
          viralScore: 95,
          hook: 'Třetí trik mi ušetřil desítky hodin práce a funguje okamžitě.',
          angle: 'Rychlé, vizuálně chytlavé tipy s okamžitou hodnotou pro Shorts/Reels.',
          tags: ['#lifehacks', '#shorts', '#productivity'],
        },
      ];

      return NextResponse.json({ topics: generatedTopics });
    }

    // ==========================================
    // 2. REŽIM: AI THUMBNAIL NÁVRH
    // ==========================================
    if (mode === 'thumbnail') {
      const targetTitle = title || topic || 'YouTube Video';

      if (apiKey) {
        try {
          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.85,
              messages: [
                {
                  role: 'system',
                  content:
                    'Jsi expert na YouTube thumbnaily. Pro zadané video navrhni 3 různé koncepty thumbnailů. Odpověz POUZE validním JSON polem: [{"headline": string (max 5 slov, velká písmena), "visualConcept": string (popis vizuálu), "colorScheme": string (barvy), "emotion": string (emoce na tváři / styl), "clickbaitLevel": number (1-10)}]',
                },
                { role: 'user', content: `Název videa: ${targetTitle}` },
              ],
            }),
          });

          if (openAiRes.ok) {
            const data = await openAiRes.json();
            const rawContent = data.choices[0]?.message?.content?.trim();
            const cleanJson = rawContent.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json({ thumbnails: parsed });
          }
        } catch (e) {
          console.warn('OpenAI thumbnail fallback:', e);
        }
      }

      // Fallback
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({
        thumbnails: [
          {
            headline: `${targetTitle.split(' ').slice(0, 4).join(' ').toUpperCase()}!`,
            visualConcept: 'Tvůrce v popředí s překvapeným výrazem, rozmazané pozadí s neonovými barvami.',
            colorScheme: 'Tmavé pozadí + žlutý/oranžový text + červený rám',
            emotion: 'Šok & překvapení',
            clickbaitLevel: 9,
          },
          {
            headline: `TOHLE ZMĚNÍ VŠE!`,
            visualConcept: 'Split-screen: špatná varianta vlevo (červený křížek) vs. správná vpravo (zelená fajfka).',
            colorScheme: 'Bílé pozadí + červená a zelená + tučný text',
            emotion: 'Kontrast & jasnost',
            clickbaitLevel: 8,
          },
          {
            headline: `NIKDO VÁM NEŘEKL...`,
            visualConcept: 'Detailní záběr na produkt/obrazovku s rámečkem "ODHALENO" v rohu.',
            colorScheme: 'Černé pozadí + purpurový gradient + bílý text',
            emotion: 'Tajemství & zvědavost',
            clickbaitLevel: 10,
          },
        ],
      });
    }

    // ==========================================
    // 3. REŽIM: YOUTUBE DESCRIPTION + TAGS
    // ==========================================
    if (mode === 'description') {
      if (!scriptContent || scriptContent.trim().length === 0) {
        return NextResponse.json({ error: 'Nebyl zadán scénář pro generování popisku' }, { status: 400 });
      }
      const targetTitle = title || topic || 'YouTube Video';

      if (apiKey) {
        try {
          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.75,
              messages: [
                {
                  role: 'system',
                  content:
                    'Jsi YouTube SEO expert. Na základě scénáře videa vygeneruj: 1) Poutavý popis videa (první 2 věty jsou klíčové pro náhled, max 400 slov), 2) SEO tagy (15-20 klíčových slov). Odpověz POUZE validním JSON: {"description": string, "tags": string[]}',
                },
                { role: 'user', content: `Název: ${targetTitle}\n\nScénář:\n${scriptContent.slice(0, 2000)}` },
              ],
            }),
          });

          if (openAiRes.ok) {
            const data = await openAiRes.json();
            const rawContent = data.choices[0]?.message?.content?.trim();
            const cleanJson = rawContent.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json(parsed);
          }
        } catch (e) {
          console.warn('OpenAI description fallback:', e);
        }
      }

      // Fallback
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({
        description: `${targetTitle}\n\nV tomto videu vám ukážu vše, co potřebujete vědět o tématu ${title || topic}. Sledujte celé video, abyste nezmeškali klíčové informace!\n\n🔔 Přihlaste se k odběru pro více takových videí!\n👍 Pokud vám video pomohlo, dejte like – pomáhá to kanálu enormně!\n💬 Napište do komentářů svůj názor nebo otázku!\n\n📌 Časové značky:\n00:00 – Úvod\n01:00 – Hlavní část\n05:00 – Klíčové tipy\n07:00 – Závěr`,
        tags: [
          title || topic,
          'YouTube',
          'návod',
          'jak na to',
          'tipy',
          'tutorial',
          'česky',
          'AI',
          'automatizace',
          'produktivita',
          'tvůrce obsahu',
          '2026',
          'YouTube růst',
          'YouTube kanál',
          'virální video',
        ],
      });
    }


    if (mode === 'humanize') {
      if (!scriptContent || scriptContent.trim().length === 0) {
        return NextResponse.json({ error: 'Nebyl zadán text k přepsání' }, { status: 400 });
      }

      if (apiKey) {
        try {
          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.85,
              messages: [
                {
                  role: 'system',
                  content:
                    'Jsi špičkový YouTube scénárista a mluvní kouč. Tvým úkolem je "odrobotizovat" AI text a přepsat ho do přirozeného, živého mluveného jazyka tak, jak mluví populární YouTube tvůrci. Odstraň klišé jako "V dnešním uspěchaném světě", nahraď knižní vazby hovorovými obraty, přidej režijní poznámky [odmlka], [b-roll: ...] a důrazy *takto*. Odpověz POUZE výsledným textem scénáře.',
                },
                {
                  role: 'user',
                  content: `Styl humanizace: ${humanizeStyle}\nPřepiš tento text do přirozené mluvy pro video:\n\n${scriptContent}`,
                },
              ],
            }),
          });

          if (openAiRes.ok) {
            const data = await openAiRes.json();
            const output = data.choices[0]?.message?.content?.trim();
            return NextResponse.json({ output, words: output.split(/\s+/).length });
          }
        } catch (e) {
          console.warn('OpenAI humanizer fallback:', e);
        }
      }

      // Fallback humanizer algoritmus
      await new Promise((r) => setTimeout(r, 700));

      let humanized = scriptContent
        .replace(/V dnešním dynamickém světě|V dnešní době plné technologií|V dnešním rychle se měnícím světě/gi, 'Představte si tohle:')
        .replace(/Pojďme se ponořit do|Pojďme se na to podívat podrobněji/gi, 'A teď to hlavní [odmlka]')
        .replace(/Je důležité si uvědomit, že/gi, 'Tady je ten háček:')
        .replace(/V závěru bychom rádi shrnuli, že/gi, 'Co si z toho odnést?')
        .replace(/Nezapomeňte zanechat komentář a dát like/gi, 'Hoďte do komentářů svůj názor a pokud vám to dalo hodnotu, klikněte na odběr.');

      // Přidání dynamických mluvních odmlk a B-roll doporučení pro autentický zážitek
      if (!humanized.includes('[odmlka]')) {
        humanized = humanized.replace(/\. /g, '. [odmlka] \n\n');
      }

      const finalOutput =
        `🔥 [HUMANIZED VERZE PRO HLAS / KAMERU]\n` +
        `💡 Styl: ${humanizeStyle === 'punchy' ? 'Úderný & Rychlý' : humanizeStyle === 'conversational' ? 'Kamarádský & Uvolněný' : 'Přirozený YouTube Flow'}\n\n` +
        `${humanized}\n\n` +
        `🎬 [REŽIJNÍ TIP]: Udržuj přímý oční kontakt s objektivem. Při slovech s důrazem mírně ztiš hlas pro zvýšení pozornosti!`;

      return NextResponse.json({
        output: finalOutput,
        words: finalOutput.split(/\s+/).length,
        readingTimeMin: Math.ceil(finalOutput.split(/\s+/).length / 135),
      });
    }

    // ==========================================
    // 3. REŽIM: GENERACE SCÉNÁŘE (SCRIPT)
    // ==========================================
    const targetTopic = topic || title || 'Tajemství úspěchu na YouTube';
    const isShorts = format === 'shorts';

    if (apiKey) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.8,
            messages: [
              {
                role: 'system',
                content:
                  `Jsi špičkový tvůrce YouTube scénářů s vysokou mírou udržení pozornosti (retention). ` +
                  `Vytvoř scénář v češtině pro formát: ${isShorts ? 'YouTube Shorts / Reels (vertikální, 45-60s)' : 'Standardní YouTube Video (horizontální, 6-8 minut)'}. ` +
                  `Cílová skupina: ${audience}. Tón: ${tone}. ` +
                  `Struktura musí obsahovat: ` +
                  `1. HOOK (prvních 3-5 sekund, vizuální popis + textový háček) ` +
                  `2. INTRO & SLIB (proč dokoukat až do konce) ` +
                  `3. JÁDRO (bod po bodu s přesnými instrukcemi pro B-roll a kameru) ` +
                  `4. RETENTION RESET (udržení tempa v polovině) ` +
                  `5. ZÁVĚR & VIRÁLNÍ CALL TO ACTION.`,
              },
              {
                role: 'user',
                content: `Téma videa: ${targetTopic}`,
              },
            ],
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const output = data.choices[0]?.message?.content?.trim();
          return NextResponse.json({
            output,
            words: output.split(/\s+/).length,
            readingTimeMin: Math.ceil(output.split(/\s+/).length / 135),
          });
        }
      } catch (e) {
        console.warn('OpenAI script fallback:', e);
      }
    }

    // Chytrý předdefinovaný profesionální YouTube skript
    await new Promise((r) => setTimeout(r, 750));

    let generatedScript = '';

    if (isShorts) {
      generatedScript =
`📱 KOMPLETNÍ SCÉNÁŘ PRO SHORTS / TIKTOK (45-60 SEC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TÉMA: ${targetTopic}
👥 CÍLOVKA: ${audience} | ⚡ TÓN: ${tone}

[0:00 - 0:04] 🪝 VIRÁLNÍ HOOK
Visual: Zoom na obličej s překvapeným výrazem / Rychlý prostřih na obrazovku.
Mluvené slovo: "Stop scrollingu! Jestli řešíte ${targetTopic}, tohle vám právě teď zachrání hodiny času."
[Na obrazovce velký nápis: ⚠️ POZOR NA TOHLE!]

[0:05 - 0:15] 💥 PROBLÉM & PŘEKVAPENÍ
Visual: Textové bubliny se zápornými výsledky, dynamický zvuk 'whoosh'.
Mluvené slovo: "Většina lidí dělá obrovskou chybu. Myslí si, že stačí dělat to co všichni ostatní... Jenže realita? Takhle přicházíte o výsledky i peníze."

[0:16 - 0:38] 💡 AKČNÍ ŘEŠENÍ (3 KROKY)
Visual: Zelené fajfky, screencast nebo ukázka v ruce.
Mluvené slovo:
"Tady je přesný postup:
Krok jedna: Okamžitě vypněte staré zvyky a nastavte si systém.
Krok dva: Použijte jednoduchý trik s automatizací — sledujte, jak rychle to jde.
A to nejdůležitější na závěr? Nikdy nepřeskakujte konzistenci."

[0:39 - 0:50] 🚀 CALL TO ACTION & LOOP HOOK
Visual: Ukázání prstem dolů na komentáře / profil.
Mluvené slovo: "Napište mi do komentářů, jestli tohle už používáte, a klepněte na sledovat pro další tajné triky!"
[Loop efekt: plynulý přechod zpět na začátek]`;
    } else {
      generatedScript =
`🎬 KOMPLETNÍ YOUTUBE SCÉNÁŘ (DLOUHÉ VIDEO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NÁZEV: ${targetTopic}
👥 CÍLOVKA: ${audience} | 🎙️ TÓN: ${tone}
⏱️ ODHADOVANÁ DÉLKA: 7-9 minut

========================================
1. KAPITOLA: HOOK & INTRO (0:00 - 1:15)
========================================
[B-ROLL]: Rychlé sestřihy klíčových momentů videa, dramatický podkres.
MLUVČÍ (do kamery):
"Představte si, že existuje jedna věc, která dokáže kompletně otočit vaše výsledky v ${targetTopic}.
Zní to jako klišé? Taky jsem si to myslel... dokud jsem neotestoval to, co vám ukážu za malou chvíli.
V dnešním videu vám ukážu nejenom přesný systém krok za krokem, ale hlavně se podíváme na 3 kritické chyby, které dělají i pokročilí tvůrci."

[GRAFIKA]: Osnova videa — 1. Příprava, 2. Tajná metoda, 3. Finální exekuce.

========================================
2. KAPITOLA: PROČ STARÝ PŘÍSTUP SELHÁVÁ (1:15 - 3:00)
========================================
[B-ROLL]: Ukázka frustrace / grafy poklesu / reálná data.
MLUVČÍ:
"Problém číslo jedna je, že většina rad na internetu pochází z doby před dvěma lety. Trh se posunul, algoritmy se změnily.
Když se podíváte na úspěšné tvůrce, všimněte si jednoho detailu:
Neztrácí čas manuální prací tam, kde mají pracovat chytřejší nástroje."

========================================
3. KAPITOLA: PŘESNÝ POSTUP KROK ZA KROKEM (3:00 - 5:45)
========================================
[B-ROLL]: Záznam obrazovky s detailním zvětšením, šipky ukazující na klíčová tlačítka.
MLUVČÍ:
"Pojďme do praxe.
Krok č. 1: Správná příprava. Bez pevných základů dům nepostavíte.
Krok č. 2: Implementace automatizace — tady ušetříte až 80 % energie.
Krok č. 3: Zpětná vazba a optimalizace. Sledujte čísla, ne domněnky."

========================================
4. KAPITOLA: RETENTION BOOSTER & TAJNÝ TIP (5:45 - 7:00)
========================================
MLUVČÍ:
"A teď slíbený bonus pro ty z vás, kteří dokoukali až sem.
Tenhle malý detail téměř nikdo nepoužívá, ale má největší dopad na finální úspěch..."
[B-ROLL]: Exkluzivní náhled do zákulisí / srovnání před a po.

========================================
5. KAPITOLA: ZÁVĚR & CALL TO ACTION (7:00 - 8:00)
========================================
MLUVČÍ:
"Pokud vám tohle video ušetřilo aspoň hodinu času, dejte like a napište do komentářů své největší uvědomění.
Kompletní šablonu máte v popisku videa. Nezapomeňte na odběr a vidíme se u dalšího videa!"
[OUTRO]: Doporučená další dvě videa z kanálu na obrazovce (End Screen).`;
    }

    const words = generatedScript.split(/\s+/).length;
    const readingTimeMin = isShorts ? 1 : Math.ceil(words / 130);

    return NextResponse.json({
      output: generatedScript,
      words,
      readingTimeMin,
      format: isShorts ? 'shorts' : 'long',
      topic: targetTopic,
    });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json({ error: 'Došlo k chybě při generování obsahu' }, { status: 500 });
  }
}