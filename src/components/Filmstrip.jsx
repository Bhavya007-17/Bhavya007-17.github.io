import React from 'react';
import MediaThumb from './MediaThumb.jsx';

// A slim row of small tiles under the hero, one per `profile.reel` entry, each linking to its project.
// Video tiles are muted loops that play only while on screen and never while motion is paused (MediaThumb handles both);
// with motion paused they show their poster. The thumbnail is hidden from assistive tech, so each link is named by its caption.
export default function Filmstrip({ clips = [] }) {
  if (!clips.length) return null;
  return <ul className="filmstrip" role="list">{clips.map(clip => <li key={clip.project}>
    <a href={`#/project/${clip.project}`}>
      <span className="strip-thumb" aria-hidden="true">
        <MediaThumb media={{ type: clip.type, src: clip.src, poster: clip.poster, alt: clip.caption }} autoPlay ratio="16 / 9" />
      </span>
      <span className="strip-caption">{clip.caption}</span>
    </a>
  </li>)}</ul>;
}
