import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Načtení nastavení
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'singleton' },
      });
    }
    // Nikdy nevracíme OpenAI klíč v plaintextu do klienta – jen příznak jestli je nastaven
    return NextResponse.json({
      weeklyGoal: settings.weeklyGoal,
      channelName: settings.channelName,
      hasOpenaiKey: settings.openaiKey.length > 0,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Chyba při načítání nastavení' }, { status: 500 });
  }
}

// PATCH: Uložení nastavení
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { weeklyGoal, channelName, openaiKey } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (weeklyGoal !== undefined) dataToUpdate.weeklyGoal = Number(weeklyGoal);
    if (channelName !== undefined) dataToUpdate.channelName = String(channelName).trim();
    if (openaiKey !== undefined) dataToUpdate.openaiKey = String(openaiKey).trim();

    const updated = await prisma.settings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...dataToUpdate },
      update: dataToUpdate,
    });

    return NextResponse.json({
      weeklyGoal: updated.weeklyGoal,
      channelName: updated.channelName,
      hasOpenaiKey: updated.openaiKey.length > 0,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Chyba při ukládání nastavení' }, { status: 500 });
  }
}
