import React, { useEffect, useRef, useState } from 'react';
import useInView, { useMotion } from './useInView.js';

const Arrow = () => <span aria-hidden="true">→</span>;

function ReelPoster({ clip }) {
  const [bad, setBad] = useState(false);
  if (bad) return <span className="media-fallback" aria-hidden="true"><span>{clip.caption}</span></span>;
  return <img src={clip.poster} alt="" loading="lazy" decoding="async" onError={() => setBad(true)} />;
}

// Reduced motion: nothing moves, just a grid of posters, each linking to its project.
// The link text is the visible caption (no aria-label), so what is announced matches what is read: "(simulation)" included.
function ReelGrid({ clips }) {
  return <section className="showreel reel-static" aria-label="Project highlights">
    <ul className="reel-grid" role="list">{clips.map(clip => <li key={clip.project}>
      <a href={`#/project/${clip.project}`}>
        <span className="reel-tile"><ReelPoster clip={clip} /></span>
        <span className="reel-tile-caption">{clip.caption}</span>
      </a>
    </li>)}</ul>
  </section>;
}

const AUTO_ADVANCE_ON_ERROR_MS = 3500;

// Plays the reel clips one at a time, muted. Only the current clip is ever in the page, so only it loads.
// The site-wide motion toggle (header) pauses it.
function ReelPlayer({ clips, nameOf }) {
  const [index, setIndex] = useState(0);
  const [failedAt, setFailedAt] = useState(null);
  const { paused } = useMotion();
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
    <a className="reel-stage" href={`#/project/${clip.project}`} aria-label={`Open the ${nameOf(clip.project)} case study: ${clip.caption}`}>
      {failed
        ? <ReelPoster clip={clip} />
        : <video key={clip.src} ref={video} src={clip.src} poster={clip.poster} muted playsInline preload="none" aria-hidden="true" onEnded={next} onError={() => setFailedAt(index)} />}
      <span className="reel-chip"><span className="reel-caption">{clip.caption}</span><Arrow /></span>
    </a>
    <div className="reel-bar">
      <div className="reel-dots" role="group" aria-label="Choose a showreel clip">
        {clips.map((item, i) => <button key={item.project} type="button" aria-label={`Show clip ${i + 1} of ${clips.length}: ${item.caption}`} aria-current={i === index ? 'true' : undefined}
          onClick={() => setIndex(i)} />)}
      </div>
    </div>
  </section>;
}

export default function Showreel({ clips = [], projects = [] }) {
  const { paused, reduced } = useMotion();
  const nameOf = id => projects.find(project => project.id === id)?.name || 'project';
  if (!clips.length) return null;
  // The poster grid replaces the player while the system asks for reduced motion and the visitor has not opted in to motion.
  return reduced && paused ? <ReelGrid clips={clips} /> : <ReelPlayer clips={clips} nameOf={nameOf} />;
}
