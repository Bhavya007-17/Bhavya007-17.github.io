import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import content from './data/projects.json';
import CaseStudy from './components/CaseStudy.jsx';
import MotionToggle from './components/MotionToggle.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import Showreel from './components/Showreel.jsx';
import Skills from './components/Skills.jsx';
import TradeStudy from './components/TradeStudy.jsx';

// Three.js lives in its own chunk, loaded only when the home page renders.
const ArmHero = lazy(() => import('./components/ArmHero.jsx'));
const { profile, projects } = content;
const SITE_TITLE = 'Bhavya Dosi — Mechanical Engineering & Robotics';
const Arrow = () => <span aria-hidden="true">↗</span>;
const isDetail = hash => hash.startsWith('#/project/') || hash.startsWith('#/study/');

// The browser cannot restore scroll for a client-rendered hash route (the page is still short when it tries),
// so restoration is handled by useRoute.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function scrollToSection(hash) {
  const id = hash.slice(2);
  if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
  else window.scrollTo(0, 0);
}

function useRoute() {
  const [hash, setHash] = useState(() => location.hash || '#/');
  const state = useRef({ hash, boot: true, clicked: false, restore: null, scroll: new Map() });
  useEffect(() => {
    const m = state.current;
    const remember = () => { if (!isDetail(m.hash)) m.scroll.set(m.hash, window.scrollY); };
    const onClick = event => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = event.target.closest?.('a[href^="#/"]')?.getAttribute('href');
      if (!href) return;
      if (href === (location.hash || '#/')) { if (!isDetail(href)) scrollToSection(href); return; }
      remember(); m.clicked = true;
    };
    const onHashChange = () => {
      const next = location.hash || '#/';
      if (next === m.hash) return;
      // Back/forward from a detail page to a home position restores the saved scroll instead of jumping to its section.
      m.restore = !m.clicked && isDetail(m.hash) && !isDetail(next) && m.scroll.has(next) ? m.scroll.get(next) : null;
      m.clicked = false; m.hash = next; setHash(next);
    };
    window.addEventListener('hashchange', onHashChange); window.addEventListener('scroll', remember, { passive: true }); document.addEventListener('click', onClick);
    return () => { window.removeEventListener('hashchange', onHashChange); window.removeEventListener('scroll', remember); document.removeEventListener('click', onClick); };
  }, []);
  useEffect(() => {
    const m = state.current;
    const frame = requestAnimationFrame(() => {
      const initial = m.boot, restore = m.restore;
      m.boot = false; m.restore = null;
      if (isDetail(hash)) { window.scrollTo(0, 0); document.getElementById('main')?.focus({ preventScroll: true }); return; }
      if (restore != null) window.scrollTo(0, restore);
      else if (hash.slice(2)) scrollToSection(hash);
      else if (!initial) window.scrollTo(0, 0); // no scroll on a fresh load: it would move the keyboard focus start point past the skip link
      m.scroll.set(hash, window.scrollY);
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  return hash;
}

function Header() {
  return <header className="site-header"><div className="shell header-inner"><a href="#/" className="brand" aria-label="Bhavya Dosi, home"><span className="brand-icon" aria-hidden="true">B.</span><span>Bhavya Dosi</span></a><nav aria-label="Main navigation"><a href="#/projects">Projects</a><a href="#/about">About</a><a href="#/contact">Contact</a><MotionToggle /><a className="nav-resume" href={profile.resume} target="_blank" rel="noreferrer">Resume <Arrow /></a></nav></div></header>;
}

// DOM order is copy, actions, arm so keyboard users reach Resume first; CSS grid areas put the arm beside the copy (or under it on phones).
function Hero() {
  const firstName = profile.name.split(' ')[0];
  return <section className="hero shell" aria-labelledby="hero-title">
    <div className="hero-copy">
      <span className="intro-label">{profile.headline}</span>
      <h1 id="hero-title">Hi, I’m {firstName}.</h1>
      <p className="hero-focus">{profile.tagline}</p>
    </div>
    <div className="hero-cta">
      <p className="hero-availability">{profile.availability}</p>
      <div className="hero-actions">
        <a className="primary-link" href={profile.resume} target="_blank" rel="noreferrer">Resume <Arrow /></a>
        <a className="quiet-link" href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a>
        <a className="quiet-link" href={`mailto:${profile.email}`}>Email <Arrow /></a>
        <a className="quiet-link" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a>
      </div>
    </div>
    <div className="hero-visual"><Suspense fallback={<div className="arm-loading" aria-label="Loading arm animation" />}><ArmHero /></Suspense></div>
  </section>;
}

function InMotion() {
  return <section id="in-motion" className="reel-section shell" aria-labelledby="in-motion-title">
    <div className="section-title"><div><h2 id="in-motion-title">In motion</h2><p>Real footage from the projects — simulation runs and a bench prototype.</p></div></div>
    <Showreel clips={profile.reel} projects={projects} />
  </section>;
}

function Projects() {
  return <section id="projects" className="projects-section shell">
    <div className="section-title"><div><h2>Selected work</h2><p>Each one is a short case study: the problem, the design decisions, and sourced results.</p></div><a className="quiet-link" href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a></div>
    <div className="project-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} lead={index === 0} />)}</div>
  </section>;
}

function About() {
  return <section id="about" className="about-section shell"><div className="about-intro"><h2>A little about me</h2><p>{profile.summary}</p><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">Read my resume <Arrow /></a><div className="education"><h3>Education</h3><p>{profile.education}</p><span>{profile.educationDetail}</span></div></div><div className="experience"><h3>Where I’m building</h3>{profile.experience.map(item => <article className="experience-item" key={item.role + item.organization}><div className="experience-heading"><h4>{item.role}</h4><span>{item.dates}</span></div><p className="organization">{item.organization}</p><p>{item.description}</p></article>)}</div></section>;
}

function Contact() {
  return <section id="contact" className="contact-section shell"><div><h2>Let’s talk robotics.</h2><p>For opportunities, collaborations, or an interesting engineering problem.</p><a className="email-link" href={`mailto:${profile.email}`}>{profile.email} <Arrow /></a></div><div className="social-links"><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a><a href={profile.resume} target="_blank" rel="noreferrer">Resume <Arrow /></a></div></section>;
}

function Home() {
  return <main id="main" tabIndex="-1"><div id="top" /><Hero /><InMotion /><Projects /><Skills groups={profile.skills} projects={projects} /><About /><Contact /></main>;
}

export default function App() {
  const route = useRoute();
  const requestedId = route.startsWith('#/project/') ? route.slice(10) : null;
  const projectId = requestedId === 'p1' ? 'act-training' : requestedId;
  const studyId = route.startsWith('#/study/') ? route.slice(8) : null;
  return <><a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a><Header />{projectId !== null ? <CaseStudy key={projectId} project={projects.find(p => p.id === projectId)} projects={projects} siteTitle={SITE_TITLE} /> : studyId !== null ? <TradeStudy key={studyId} id={studyId} siteTitle={SITE_TITLE} /> : <Home />}<footer className="site-footer shell"><span>Bhavya Dosi</span><span>Built with curiosity. Always in progress.</span><a href="#/">Back to top ↑</a></footer></>;
}
