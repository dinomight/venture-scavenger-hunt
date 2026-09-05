import Pusher from 'pusher';

let pusherServerInstance: Pusher | null = null;
let isPusherInitialized = false;

function getPusherServer(): Pusher | null {
  if (isPusherInitialized) {
    return pusherServerInstance;
  }

  isPusherInitialized = true;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || 'us2';

  if (!appId || !key || !secret) {
    return null;
  }

  try {
    pusherServerInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: process.env.PUSHER_USE_TLS !== 'false',
      host: process.env.PUSHER_HOST,
      port: process.env.PUSHER_PORT,
    });
  } catch (error) {
    console.error('Failed to initialize Pusher server client:', error);
    pusherServerInstance = null;
  }

  return pusherServerInstance;
}

export function getHuntChannelName(yearNumber: number): string {
  return `hunt-${yearNumber}`;
}

export async function broadcastHuntUpdate(
  yearNumber: number,
  event: string,
  data?: unknown
): Promise<void> {
  const pusher = getPusherServer();
  const channel = getHuntChannelName(yearNumber);

  if (!pusher) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Realtime:DevLog] Broadcast on ${channel} -> ${event}`, data ?? {});
    }
    return;
  }

  try {
    await pusher.trigger(channel, event, data ?? {});
  } catch (error) {
    console.error(`Failed to broadcast real-time event "${event}" on channel "${channel}":`, error);
  }
}
