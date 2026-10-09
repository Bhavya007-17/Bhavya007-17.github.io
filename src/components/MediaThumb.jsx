import React, { useEffect, useRef, useState } from 'react';
import useInView, { useMotion } from './useInView.js';

// Shown when a file is missing or cannot be decoded: the alt text stands in for the picture.
function Fallback({ media }) {
  return <div className="media-fallback" role="img" aria-label={media.alt}><span aria-hidden="true">{media.alt}</span></div>;
}

function PosterFallback({ media }) {
  const [bad, setBad] = useState(!media.poster);
  if (bad) return <Fallback media={media} />;
  return <img src={media.poster} alt={media.alt} decoding="async" onError={() => setBad(true)} />;
}

function ImageThumb({ media }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Fallback media={media} />;
  return <img src={media.src} alt={media.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

function VideoThumb({ media, autoPlay, controls }) {
  const wrap = useRef(null), video = useRef(null);
  const inView = useInView(wrap, { threshold: 0.5 });
  const { paused: motionPaused } = useMotion();
  const [failed, setFailed] = useState(false);
  // A video that has not started loading (preload="none") reports nothing when its poster is missing, so probe the poster.
  const [posterBad, setPosterBad] = useState(false);
  useEffect(() => {
    if (!media.poster) return;
    const probe = new Image();
    probe.onerror = () => setPosterBad(true);
    probe.src = media.poster;
    return () => { probe.onerror = null; };
  }, [media.poster]);
  // Whether the visitor paused it with the native controls (so scrolling back must not restart it), and whether this pause was ours.
  const userPaused = useRef(false), ourPause = useRef(false);
  const shouldPlay = autoPlay && inView && !motionPaused && !failed;

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (shouldPlay) {
      if (userPaused.current) return;
      el.muted = true;
      el.play()?.catch(() => {});
    } else if (!el.paused) {
      ourPause.current = true;
      el.pause();
    }
  }, [shouldPlay]);

  const onPause = () => { if (ourPause.current) ourPause.current = false; else if (autoPlay) userPaused.current = true; };
  const onPlay = () => { userPaused.current = false; };

  return <div className="media-thumb-inner" ref={wrap}>
    {posterBad && !failed && <div className="media-fallback" aria-hidden="true"><span>{media.alt}</span></div>}
    {failed
      ? <PosterFallback media={media} />
      : <video ref={video} className={posterBad ? 'no-poster' : undefined} src={media.src} poster={media.poster} muted={autoPlay} loop={autoPlay} playsInline preload="none" controls={controls}
          aria-label={controls ? media.alt : undefined} aria-hidden={controls ? undefined : true}
          onPause={onPause} onPlay={onPlay} onError={() => setFailed(true)}>
          {media.captions && <track kind="captions" src={media.captions} srcLang="en" label="English" />}
        </video>}
  </div>;
}

// One picture or clip from the data (`{type, src, poster?, alt}`).
// autoPlay: muted, looping video that plays only while at least half of it is on screen (never while motion is paused: the site-wide toggle, or prefers-reduced-motion by default).
// controls: native controls; without autoPlay it is a click-to-play video with a poster and nothing preloaded.
export default function MediaThumb({ media, autoPlay = false, controls = false, ratio, fit = 'cover', className = '' }) {
  if (!media) return null;
  const style = ratio ? { aspectRatio: ratio } : undefined;
  return <div className={`media-thumb ${fit === 'contain' ? 'contain' : ''} ${className}`.trim()} style={style}>
    {media.type === 'video'
      ? <VideoThumb key={media.src} media={media} autoPlay={autoPlay} controls={controls} />
      : <ImageThumb key={media.src} media={media} />}
  </div>;
}
