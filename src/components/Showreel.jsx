import React, { useEffect, useRef, useState } from 'react';
import useInView, { useReducedMotion } from './useInView.js';

const Arrow = () => <span aria-hidden="true">→</span>;
const PlayIcon = () => <svg className="ctl-icon" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 1 9 5 2 9z" fill="currentColor" /></svg>;
const PauseIcon = () => <svg className="ctl-icon" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" /></svg>;

// Under reduced motion nothing moves: a plain grid of posters, each linking to its project.
function ReelGrid({ clips, nameOf }) {
  return <section className="showreel reel-static" aria-label="Project highlights">
    <ul className="reel-grid" role="list">{clips.map(clip => <li key={clip.project}>
      <a href={`#/project/${clip.project}`} aria-label={`Open the ${nameOf(clip.project)} case study`}>
        <span className="reel-tile"><ReelPoster clip={clip} /></span>
        <span className="reel-tile-caption">{clip.caption}</span>
      </a>
    </li>)}</ul>
  </section>;
}

function ReelPoster({ clip }) {
  const [bad, setBad] = useState(false);
  if (bad) return <span className="media-fallback" aria-hidden="true"><span>{clip.caption}</span></span>;
  return <img src={clip.poster} alt="" loading="lazy" decoding="async" onError={() => setBad(true)} />;
}

const AUTO_ADVANCE_ON_ERROR_MS = 3500;

// Plays the reel clips one at a time, muted. Only the current clip is ever in the page, so only it loads.
function ReelPlayer({ clips, nameOf }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedAt, setFailedAt] = useState(null);
  const root = useRef(null), video = useRef(null);
  const inView = useInView(root, { threshold: 0.5 });
  const clip = clips[index];
  const playing = inView && !paused;
  const failed = failedAt === index;
  const next = () => setIndex(i => (i + 1) % clips.length);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (playing && !failed) { el.muted = true; el.play()?.catch(() => {}); } else el.pause();
  }, [playing, index, failed]);

  // A clip that cannot load is skipped after a moment instead of stalling the reel.
  useEffect(() => {
    if (!failed || !playing || clips.length < 2) return;
    const timer = setTimeout(next, AUTO_ADVANCE_ON_ERROR_MS);
    return () => clearTimeout(timer);
  }, [failed, playing, clips.length]);

  return <section className="showreel" ref={root} aria-label="Project showreel">
    <a className="reel-stage" href={`#/project/${clip.project}`} aria-label={`Open the ${nameOf(clip.project)} case study. Now showing: ${clip.caption}`}>
      {failed
        ? <ReelPoster clip={clip} />
        : <video key={clip.src} ref={video} src={clip.src} poster={clip.poster} muted playsInline preload="none" aria-hidden="true" onEnded={next} onError={() => setFailedAt(index)} />}
      <span className="reel-chip"><span>{clip.caption}</span><Arrow /></span>
    </a>
    <div className="reel-bar">
      <div className="reel-dots" role="group" aria-label="Choose a showreel clip">
        {clips.map((item, i) => <button key={item.project} type="button" aria-label={`Show clip ${i + 1} of ${clips.length}: ${item.caption}`} aria-current={i === index ? 'true' : undefined}
          onClick={() => { setIndex(i); setPaused(false); }} />)}
      </div>
      <button type="button" className="reel-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
        {paused ? <PlayIcon /> : <PauseIcon />}<span>{paused ? 'Play reel' : 'Pause reel'}</span>
      </button>
    </div>
  </section>;
}

export default function Showreel({ clips = [], projects = [] }) {
  const reduced = useReducedMotion();
  const nameOf = id => projects.find(project => project.id === id)?.name || 'project';
  if (!clips.length) return null;
  return reduced ? <ReelGrid clips={clips} nameOf={nameOf} /> : <ReelPlayer clips={clips} nameOf={nameOf} />;
}
