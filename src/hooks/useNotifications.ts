'use client';

import { useEffect, useCallback, useRef } from 'react';

// Sound generator using Web Audio API - no external files needed
function playNotificationSound(type: 'target' | 'stoploss' | 'new' | 'info') {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

    switch (type) {
      case 'target':
        // Happy ascending tone - 3 notes
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.15); // E5
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.3); // G5
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case 'stoploss':
        // Alert descending tone - 2 notes
        oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
        oscillator.frequency.setValueAtTime(330, ctx.currentTime + 0.2); // E4
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.type = 'sawtooth';
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case 'new':
        // Notification tone - 2 quick high notes
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.1); // C6
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'info':
        // Gentle single tone
        oscillator.frequency.setValueAtTime(660, ctx.currentTime); // E5
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
    }

    setTimeout(() => ctx.close(), 2000);
  } catch {}
}

interface NotificationHook {
  requestPermission: () => Promise<boolean>;
  subscribe: (userId: string) => Promise<void>;
  sendTestNotification: () => void;
}

export function useNotifications(): NotificationHook {
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        swRef.current = reg;
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const subscribe = useCallback(async (userId: string) => {
    if (!swRef.current) {
      swRef.current = await navigator.serviceWorker.ready;
    }

    try {
      const subscription = await swRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-GVGVQNGJnmMP5aNFwGQpLJQ8ICulDYPp4pNkC4'
        ),
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: JSON.stringify(subscription),
        }),
      });
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }, []);

  const sendTestNotification = useCallback(() => {
    playNotificationSound('new');

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ForexYemeni Pro', {
        body: 'تم تفعيل الإشعارات بنجاح! ✅',
        icon: '/icon-192.png',
        dir: 'rtl',
        lang: 'ar',
      });
    }
  }, []);

  return { requestPermission, subscribe, sendTestNotification };
}

export { playNotificationSound };

export function useSoundAlert() {
  return { playNotificationSound };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
