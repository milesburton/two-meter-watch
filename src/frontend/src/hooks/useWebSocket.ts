import { useEffect, useRef } from 'react';
import { useConnectionStore } from '../store/connectionStore.js';
import { useWaterfallStore } from '../store/waterfallStore.js';

const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 15_000;

interface ChannelMessage {
  channel: 'waterfall' | 'sstv';
  data: unknown;
}

/**
 * Connects to the backend websocket, feeds "waterfall" channel frames into
 * waterfallStore, and tracks connection status with auto-reconnect using
 * exponential backoff.
 */
export function useWebSocket(): void {
  const pushFrame = useWaterfallStore((s) => s.pushFrame);
  const setStatus = useConnectionStore((s) => s.setStatus);
  const setReconnectAttempts = useConnectionStore((s) => s.setReconnectAttempts);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const attemptsRef = useRef(0);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let closedByEffect = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      setStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

      socket.addEventListener('open', () => {
        backoffRef.current = INITIAL_BACKOFF_MS;
        attemptsRef.current = 0;
        setReconnectAttempts(0);
        setStatus('open');
      });

      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data) as ChannelMessage;
          if (message.channel === 'waterfall') {
            pushFrame(message.data as never);
          }
        } catch {
          // ignore malformed frames
        }
      });

      socket.addEventListener('close', () => {
        setStatus('closed');
        if (closedByEffect) return;
        attemptsRef.current += 1;
        setReconnectAttempts(attemptsRef.current);
        reconnectTimer = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      });

      socket.addEventListener('error', () => {
        setStatus('error');
        socket?.close();
      });
    }

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [pushFrame, setStatus, setReconnectAttempts]);
}
