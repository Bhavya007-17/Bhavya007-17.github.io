import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import MediaThumb from './MediaThumb.jsx';

const LightboxContext = createContext(null);

// One native <dialog> per page. Enter on a thumbnail opens it, Escape or a click on the backdrop closes it,
// and focus returns to the thumbnail that opened it.
export function LightboxProvider({ children }) {
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null), closeButton = useRef(null), trigger = useRef(null);

  const open = useCallback((media, element) => {
    trigger.current = element || document.activeElement;
    setSelected(media);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const element = dialog.current, previous = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => { document.body.style.overflow = previous; if (element.open) element.close(); };
  }, [selected]);

  const onClose = () => {
    const opener = trigger.current;
    trigger.current = null;
    setSelected(null);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };

  return <LightboxContext.Provider value={open}>
    {children}
    <dialog ref={dialog} className="lightbox" aria-label={selected?.alt || 'Enlarged image'} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current.close(); }}>
      {selected && <>
        <button ref={closeButton} type="button" className="lightbox-close" aria-label="Close image" onClick={() => dialog.current.close()}>×</button>
        <figure><img src={selected.src} alt={selected.alt} />{(selected.caption || selected.alt) && <figcaption>{selected.caption || selected.alt}</figcaption>}</figure>
      </>}
    </dialog>
  </LightboxContext.Provider>;
}

// A picture that opens in the lightbox; videos and anything outside a provider render as plain media.
export function Zoomable({ media, ...props }) {
  const open = useContext(LightboxContext);
  if (!open || media.type !== 'image') return <MediaThumb media={media} {...props} />;
  return <button type="button" className="zoom" onClick={event => open(media, event.currentTarget)} aria-label={`Enlarge image: ${media.caption || media.alt}`}>
    <MediaThumb media={media} {...props} />
  </button>;
}

function GalleryGrid({ items }) {
  return <section className="gallery case-section" aria-labelledby="cs-gallery">
    <h2 id="cs-gallery">Gallery</h2>
    <ul className="gallery-grid" role="list">{items.map(item => <li key={item.src} className={item.type === 'video' ? 'gallery-item wide' : 'gallery-item'}>
      <figure>
        <Zoomable media={item} controls={item.type === 'video'} ratio={item.type === 'video' ? '16 / 9' : '4 / 3'} fit="contain" />
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
    </li>)}</ul>
  </section>;
}

export default function Gallery({ items = [] }) {
  const inProvider = useContext(LightboxContext);
  if (!items.length) return null;
  return inProvider ? <GalleryGrid items={items} /> : <LightboxProvider><GalleryGrid items={items} /></LightboxProvider>;
}
