import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

// True while at least `threshold` of the element is visible.
export default function useInView(ref, { threshold = 0.5 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    // Entries can be batched; the last one is the most recent state.
    const io = new IntersectionObserver(entries => setInView(entries[entries.length - 1].isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

// ---- Motion preference ----------------------------------------------------------------------------------------
// Every autoplaying video asks useMotion() whether motion is paused. The site-wide "Pause motion" toggle sets an explicit
// choice, remembered in localStorage (reads and writes are wrapped, so it still works when storage throws). With no
// choice the visitor's prefers-reduced-motion setting decides: paused when it is "reduce".
const REDUCED = '(prefers-reduced-motion: reduce)';
const STORAGE_KEY = 'motion';
const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function subscribeSystem(onChange) {
  if (!hasMatchMedia()) return () => {};
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
const systemReduced = () => hasMatchMedia() && window.matchMedia(REDUCED).matches;

const listeners = new Set();
const isChoice = value => value === 'paused' || value === 'playing';
function readStored() {
  try { const value = window.localStorage.getItem(STORAGE_KEY); return isChoice(value) ? value : null; } catch { return null; }
}
let choice = typeof window === 'undefined' ? null : readStored(); // 'paused' | 'playing' | null (no choice yet)
function setChoice(next) {
  choice = next;
  try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable: the choice lasts for this page view */ }
  listeners.forEach(listener => listener());
}
function subscribeChoice(onChange) {
  listeners.add(onChange);
  const onStorage = event => { if (event.key === STORAGE_KEY) { choice = readStored(); onChange(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(onChange); window.removeEventListener('storage', onStorage); };
}

// → { paused, reduced, toggle }. `reduced` is the system setting; `paused` is what every video must obey.
export function useMotion() {
  const reduced = useSyncExternalStore(subscribeSystem, systemReduced, () => false);
  const stored = useSyncExternalStore(subscribeChoice, () => choice, () => null);
  const paused = stored ? stored === 'paused' : reduced;
  const toggle = useCallback(() => setChoice(paused ? 'playing' : 'paused'), [paused]);
  return { paused, reduced, toggle };
}
