'use client';

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { getHuntChannelName } from './broadcast';

let pusherClientInstance: Pusher | null = null;
let isClientInitialized = false;

function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (isClientInitialized) {
    return pusherClientInstance;
  }

  isClientInitialized = true;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

  if (!key) {
    return null;
  }

  try {
    pusherClientInstance = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
  } catch (error) {
    console.error('Failed to initialize Pusher client:', error);
    pusherClientInstance = null;
  }

  return pusherClientInstance;
}

export const DEFAULT_HUNT_EVENTS = [
  'targets-updated',
  'submission-created',
  'submission-deleted',
  'year-updated',
] as const;

export function useHuntRealtime(
  yearNumber: number,
  onUpdate: () => void,
  events: readonly string[] = DEFAULT_HUNT_EVENTS
) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!yearNumber) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = getHuntChannelName(yearNumber);
    const channel = pusher.subscribe(channelName);

    const handleEvent = (data: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Realtime:ClientLog] Event received on ${channelName}:`, data);
      }
      onUpdateRef.current();
    };

    events.forEach((eventName) => {
      channel.bind(eventName, handleEvent);
    });

    return () => {
      events.forEach((eventName) => {
        channel.unbind(eventName, handleEvent);
      });
      pusher.unsubscribe(channelName);
    };
  }, [yearNumber, events]);
}
