import { useEffect, useState, useSyncExternalStore } from 'react';

// True while at least `threshold` of the element is visible.
export default function useInView(ref, { threshold = 0.5 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

// Live value of the visitor's prefers-reduced-motion setting. Every autoplaying video checks it.
const REDUCED = '(prefers-reduced-motion: reduce)';
const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';
function subscribe(onChange) {
  if (!hasMatchMedia()) return () => {};
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
const getSnapshot = () => hasMatchMedia() && window.matchMedia(REDUCED).matches;
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
