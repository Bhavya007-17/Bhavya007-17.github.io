import React from 'react';

// Static vector drawing of the hero arm. Kept in its own tiny module (no Three.js) so the home page can show it when WebGL is
// unavailable, when the lazy ArmHero chunk fails to load, or when ArmHero throws.
export function ArmDrawing() {
  return <svg className="arm-fallback" viewBox="0 0 400 350" role="img" aria-label="Robot arm line drawing"><g fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round"><path d="M98 308h97l-9-28h-80zM145 280v-45l-32-105 28-9 62 94 75-80 20 24-78 109-45 12"/><circle cx="127" cy="128" r="22"/><circle cx="190" cy="230" r="20"/><path d="m291 147 20 24m-4-30 26 26-15 15m-19-34-14 14 25 25"/></g></svg>;
}

// Same frame as ArmHero (so the layout does not move): the drawing plus the caption.
export default function ArmFallback() {
  return <div className="arm-hero" role="group" aria-label="Decorative robot arm picking up and placing a cube"><div className="arm-canvas"><ArmDrawing /></div><div className="arm-caption"><span>Pick. Place. Repeat.</span></div></div>;
}

// Minimal error boundary for the hero visual: if the arm throws while rendering, show the drawing instead of blanking the page.
export class ArmBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ArmFallback /> : this.props.children; }
}
