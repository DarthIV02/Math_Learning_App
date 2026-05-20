import { useEffect, useRef, useCallback } from 'react';
import { flushAttempts, PROGRESS_URL } from '../api/progress';

const QUEUE_KEY = 'attempt_queue';
const FLUSH_MS  = 30_000;

function readQueue()   { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); } catch { return []; } }
function writeQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {} }
function clearQueue()  { localStorage.removeItem(QUEUE_KEY); }

export function useAttemptQueue(token) {
  // Keep token in a ref so the interval always sees the latest value
  // without needing to be restarted when the token refreshes
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const flush = useCallback(async () => {
    const queue = readQueue();
    if (!queue.length) return;

    clearQueue(); // optimistic clear to avoid double-sending
    try {
      await flushAttempts(queue, tokenRef.current);
    } catch {
      // Put them back for the next interval to retry
      writeQueue([...readQueue(), ...queue]);
    }
  }, []);

  // sendBeacon can't set Authorization headers — embed token in body instead.
  // Your Express route should then also accept it from req.body.token as a fallback.
  const beaconFlush = useCallback(() => {
    const queue = readQueue();
    if (!queue.length) return;
    const blob = new Blob(
      [JSON.stringify({ attempts: queue, token: tokenRef.current })],
      { type: 'application/json' }
    );
    if (navigator.sendBeacon(PROGRESS_URL, blob)) clearQueue();
  }, []);

  useEffect(() => {
    const interval = setInterval(flush, FLUSH_MS);
    window.addEventListener('beforeunload', beaconFlush);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', beaconFlush);
      flush(); // SPA navigation — flush before unmount
    };
  }, [flush, beaconFlush]);

  const enqueue = useCallback((attempt) => {
    writeQueue([
      ...readQueue(),
      { ...attempt, attempted_at: new Date().toISOString() },
    ]);
  }, []);

  return { enqueue };
}