import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Načtení všech videí nebo jednoho podle ?id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const video = await prisma.video.findUnique({
        where: { id },
      });
      if (!video) {
        return NextResponse.json({ error: 'Video nebylo nalezeno' }, { status: 404 });
      }
      return NextResponse.json(video);
    }

    const videos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Chyba při načítání videí' }, { status: 500 });
  }
}

// POST: Vytvoření nového videa
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, topic, isShort = false, status = 'NÁPAD', scriptContent, scriptDone = false } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Název videa je povinný' }, { status: 400 });
    }

    const newVideo = await prisma.video.create({
      data: {
        title: title.trim(),
        topic: topic?.trim() || 'Trendy obsah',
        isShort: Boolean(isShort),
        status: status || 'NÁPAD',
        scriptDone: Boolean(scriptDone || !!scriptContent),
        scriptContent: scriptContent || null,
      },
    });

    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Chyba při ukládání videa' }, { status: 500 });
  }
}

// PATCH: Aktualizace videa (status, checklist, text scénáře, název)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, field, value, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID videa je povinné' }, { status: 400 });
    }

    // Podpora pro starý formát { id, field, value } i pro obecný { id, ...updates }
    const dataToUpdate: Record<string, unknown> = {};
    if (field !== undefined) {
      dataToUpdate[field] = value;
    }
    Object.assign(dataToUpdate, updates);

    // Pokud se nastavuje scriptContent, automaticky označíme scriptDone jako true
    if (dataToUpdate.scriptContent && dataToUpdate.scriptDone === undefined) {
      dataToUpdate.scriptDone = true;
    }

    const updated = await prisma.video.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Chyba při úpravě videa' }, { status: 500 });
  }
}

// DELETE: Smazání videa
export async function DELETE(req: NextRequest) {
  try {
    let id: string | null = null;

    // Zkus načíst ID z URL nebo těla požadavku
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // Tělo nemusí existovat
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'ID videa je povinné' }, { status: 400 });
    }

    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Chyba při mazání videa' }, { status: 500 });
  }
}