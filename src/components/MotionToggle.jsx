import React from 'react';
import { useMotion } from './useInView.js';

const PlayIcon = () => <svg className="ctl-icon" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 1 9 5 2 9z" fill="currentColor" /></svg>;
const PauseIcon = () => <svg className="ctl-icon" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" /></svg>;

// The one site-wide control for moving pictures: pauses the filmstrip and every card and step loop, and keeps new ones from starting.
// The label flips between "Pause motion" and "Play motion" (no aria-pressed, so the name alone says what a press does).
export default function MotionToggle() {
  const { paused, toggle } = useMotion();
  const label = paused ? 'Play motion' : 'Pause motion';
  return <button type="button" className="motion-toggle" onClick={toggle} title={label}>
    {paused ? <PlayIcon /> : <PauseIcon />}<span className="motion-label">{label}</span>
  </button>;
}
