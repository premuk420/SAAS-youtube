async function runVerification() {
  console.log('--- Zahájení komplexního testu SaaS YouTube AI ---');
  let failures = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failures++;
    }
  }

  // 1. Test stránek (Next.js Server Side Rendering / Client Page routes)
  await test('Stránka Nástěnka (GET /)', async () => {
    const res = await fetch('http://localhost:3000/');
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes('AI Studio')) throw new Error('HTML neobsahuje AI Studio');
  });

  await test('Stránka Témat (GET /topics)', async () => {
    const res = await fetch('http://localhost:3000/topics');
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
  });

  await test('Stránka Scénář & Humanizer (GET /script)', async () => {
    const res = await fetch('http://localhost:3000/script');
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
  });

  await test('Stránka Správa videí (GET /videos)', async () => {
    const res = await fetch('http://localhost:3000/videos');
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
  });

  // 2. Test API Generování Témat
  await test('API: Generování témat (POST /api/generate mode:topics)', async () => {
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'topics', topic: 'AI nástroje a ChatGPT' }),
    });
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.topics) || data.topics.length === 0) {
      throw new Error('Odpověď neobsahuje pole témat');
    }
    if (!data.topics[0].viralScore || !data.topics[0].hook) {
      throw new Error('Téma neobsahuje viralScore nebo hook');
    }
    console.log(`       -> Vygenerováno ${data.topics.length} témat. První: "${data.topics[0].title}" (${data.topics[0].viralScore}%)`);
  });

  // 3. Test API Generování Scénáře
  await test('API: Tvorba scénáře (POST /api/generate mode:script)', async () => {
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'script',
        topic: 'Jak vydělat s AI v roce 2026',
        format: 'shorts',
        tone: 'Poutavý & Energický',
        audience: 'Široká veřejnost',
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (!data.output || data.words < 20) {
      throw new Error('Scénář nebyl vygenerován');
    }
    console.log(`       -> Vygenerován scénář o délce ${data.words} slov, odhad: ${data.readingTimeMin} min`);
  });

  // 4. Test API AI Humanizer
  await test('API: AI Humanizer přirozená mluva (POST /api/generate mode:humanize)', async () => {
    const sampleScript = 'V dnešním dynamickém světě je důležité si uvědomit, že technologie se mění. Pojďme se ponořit do detailů.';
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'humanize',
        scriptContent: sampleScript,
        humanizeStyle: 'natural',
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (!data.output) throw new Error('Humanizovaný výstup chybí');
    console.log(`       -> Humanizovaný text: ${data.output.slice(0, 70)}...`);
  });

  // 5. Test Databáze SQLite a Návaznosti Videí (CRUD)
  let createdVideoId = null;

  await test('API: Vytvoření videa v DB (POST /api/videos)', async () => {
    const res = await fetch('http://localhost:3000/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Automatické testovací video',
        topic: 'AI Test',
        isShort: true,
        status: 'NÁPAD',
        scriptContent: 'Ukázkový scénář vygenerovaný testem',
      }),
    });
    if (res.status !== 201) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (!data.id) throw new Error('Nové video nemá ID');
    createdVideoId = data.id;
    console.log(`       -> Vytvořeno video ID: ${createdVideoId}`);
  });

  await test('API: Načtení detailu videa podle ID (GET /api/videos?id=...)', async () => {
    const res = await fetch(`http://localhost:3000/api/videos?id=${createdVideoId}`);
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (data.id !== createdVideoId || !data.scriptContent) {
      throw new Error('Detail videa neodpovídá uloženým datům');
    }
  });

  await test('API: Aktualizace stavu a úkolu (PATCH /api/videos)', async () => {
    const res = await fetch('http://localhost:3000/api/videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createdVideoId,
        field: 'audioDone',
        value: true,
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (data.audioDone !== true) throw new Error('audioDone nebylo aktualizováno');
  });

  await test('API: Smazání testovacího videa (DELETE /api/videos)', async () => {
    const res = await fetch('http://localhost:3000/api/videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: createdVideoId }),
    });
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Smazání nevrátilo success');
  });

  console.log('\n=============================================');
  if (failures === 0) {
    console.log('VŠECHNY TESTY ÚSPĚŠNĚ PROŠLY! Aplikace je 100% funkční.');
  } else {
    console.error(`DOKONČENO S CHYBAMI: ${failures} selhání.`);
    process.exit(1);
  }
}

runVerification();
