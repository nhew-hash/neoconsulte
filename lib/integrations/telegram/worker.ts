import { GramjsClient } from './gramjs-client';
import { prisma } from '@/lib/db';

async function main() {
  // Worker loop: initialize client, restore session if exists, then poll for events.
  const enabled = process.env.PROVIDER_TELEGRAM_ENABLED === 'true';
  if (!enabled) {
    console.log('Telegram worker disabled (PROVIDER_TELEGRAM_ENABLED != true)');
    process.exit(0);
  }

  const client = new GramjsClient('default');
  try {
    const restored = await client.initFromLatestSession();
    if (!restored) {
      console.log('No session found; please authenticate via admin UI.');
    }
  } catch (err) {
    console.error('Error restoring session:', err);
  }

  // Poll loop
  setInterval(async () => {
    try {
      const events = await client.consumeEvents();
      for (const ev of events) {
        // persist event
        const conn = await prisma.telegramConnection.findFirst({ where: { name: 'default' } });
        if (!conn) continue;
        await prisma.telegramEvent.create({ data: { connectionId: conn.id, chatId: ev.chatId ?? 'unknown', from: ev.from ?? 'unknown', text: ev.text ?? '', direction: 'incoming', payload: JSON.stringify(ev) } });
      }
    } catch (err) {
      console.error('Worker error consuming events:', err);
    }
  }, Number(process.env.PROVIDER_TELEGRAM_POLL_MS ?? 5000));
}

main().catch((e) => {
  console.error('Telegram worker failed', e);
  process.exit(1);
});
