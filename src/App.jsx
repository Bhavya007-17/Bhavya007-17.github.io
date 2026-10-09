import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import content from './data/projects.json';
import definitions from './data/schematics.json';
import Schematic from './components/Schematic.jsx';
import TradeStudy from './components/TradeStudy.jsx';

const ArmHero = lazy(() => import('./components/ArmHero.jsx'));
const { profile, projects } = content;
const SITE_TITLE = 'Bhavya Dosi — Mechanical Engineering & Robotics';
const categoryOf = p => ['Robotics', 'Autonomy'].includes(p.category) ? 'Robotics' : p.category === 'AI' ? 'AI' : 'Software';
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
  return <header className="site-header"><div className="shell header-inner"><a href="#/" className="brand" aria-label="Bhavya Dosi, home"><span className="brand-icon" aria-hidden="true">B.</span><span>Bhavya Dosi</span></a><nav aria-label="Main navigation"><a href="#/projects">Projects</a><a href="#/about">About</a><a href="#/contact">Contact</a><a className="nav-resume" href={profile.resume} target="_blank" rel="noreferrer">Resume <Arrow /></a></nav></div></header>;
}
function ProjectCover({ project }) {
  if (definitions[project.id]) return <Schematic projectId={project.id} compact />;
  const image = project.media?.find(item => item.type === 'image');
  if (image) return <img src={image.url} alt={image.alt} loading="lazy" />;
  return <div className="text-cover" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><rect x="9" y="6" width="30" height="36" rx="3" stroke="currentColor"/><path d="M17 16h14M17 24h14M17 32h8" stroke="currentColor" /></svg><span>{project.status.includes('dataset') ? 'Simulation dataset' : project.category === 'AI' ? 'Software & intelligence' : 'Notes from the workbench'}</span></div>;
}
function Projects() {
  return <section id="projects" className="projects-section shell">
    <div className="section-title"><div><h2>Selected work</h2><p>Robotics, learning, and the systems between them.</p></div><a className="quiet-link" href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a></div>
    <div className="project-grid">{projects.map((project, index) => {
      const titleId = `card-${project.id}-title`, summaryId = `card-${project.id}-summary`, statusId = `card-${project.id}-status`;
      return <article className={index === 0 ? 'project-card lead' : 'project-card'} key={project.id}>
        <a href={`#/project/${project.id}`} aria-labelledby={titleId} aria-describedby={`${summaryId} ${statusId}`}>
          <div className="card-cover"><ProjectCover project={project} />{project.media?.some(item => item.type === 'video') && <span className="demo-chip"><svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true" focusable="false"><path d="M1 .5 7 4 1 7.5z" fill="currentColor"/></svg>{project.id === 'hive' ? 'Concept film' : 'Demo'}</span>}</div>
          <div className="card-content"><div className="card-title"><h3 id={titleId}>{project.name}</h3><Arrow /></div><p id={summaryId}>{project.summary}</p><div className="card-meta"><span id={statusId}>{project.status}</span><span>{project.stack?.[0] || categoryOf(project)}</span></div></div>
        </a>
      </article>;
    })}</div>
  </section>;
}
function About() {
  return <section id="about" className="about-section shell"><div className="about-intro"><h2>A little about me</h2><p>{profile.summary}</p><p>I’m especially interested in swarm robotics and physical intelligence: how individual machines can understand their surroundings and work together.</p><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">Read my resume <Arrow /></a><div className="education"><h3>Education</h3><p>{profile.education}</p><span>{profile.educationDetail}</span></div></div><div className="experience"><h3>Where I’m building</h3>{profile.experience.map(item => <article className="experience-item" key={item.role}><div className="experience-heading"><h4>{item.role}</h4><span>{item.dates}</span></div><p className="organization">{item.organization}</p><p>{item.description}</p></article>)}</div><div className="skills"><span>Tools I work with</span><div>{profile.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div></section>;
}
function Contact() {
  return <section id="contact" className="contact-section shell"><div><h2>Let’s talk robotics.</h2><p>For opportunities, collaborations, or an interesting engineering problem.</p><a className="email-link" href={`mailto:${profile.email}`}>{profile.email} <Arrow /></a></div><div className="social-links"><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a><a href={profile.resume} target="_blank" rel="noreferrer">Resume <Arrow /></a></div></section>;
}
function Home() {
  return <main id="main" tabIndex="-1"><div id="top"/><section className="hero shell"><div className="hero-copy"><span className="intro-label">Mechanical engineering · Virginia Tech · Class of 2029</span><h1>Hi, I’m Bhavya.</h1><p className="hero-focus">Building toward robots<br/>that think and work together.</p><p className="hero-description">I’m a mechanical engineering sophomore. I design robot hardware in CAD, check it with FEA, and write the software that turns plain-language commands into robot motion. As Chief Engineer of CroLabs, I lead HIVE.</p><div className="hero-actions"><a className="primary-link" href="#/projects">Explore my work <span aria-hidden="true">↓</span></a><a className="quiet-link" href={profile.resume} target="_blank" rel="noreferrer">Resume <Arrow /></a></div><p className="hero-availability">Looking for Summer 2027 internships in robotics and mechatronics.</p></div><div className="hero-visual"><Suspense fallback={<div className="arm-loading" aria-label="Loading arm animation"/>}><ArmHero /></Suspense></div></section><Projects /><About /><Contact /></main>;
}
function MediaGallery({ project }) {
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const all = project.media || [];
  const media = all.filter(item => !(item.type === 'image' && all.some(video => video.type === 'video' && video.poster === item.url)));
  useEffect(() => {
    if (!selected) return;
    const element = dialog.current, previous = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; if (element.open) element.close(); };
  }, [selected]);
  if (!media.length) return null;
  return <section className="project-media"><h2>From the project</h2><div className="media-grid">{media.map((item, i) => <figure key={item.url} className={i === 0 || item.type === 'video' || item.wide ? 'wide-media' : ''}>{item.type === 'video' ? <video controls playsInline preload={project.id === 'hive' ? 'none' : 'metadata'} poster={item.poster} aria-label={item.alt}><source src={item.url} type="video/mp4"/>{item.captions && <track kind="captions" src={item.captions} srcLang="en" label="English" default/>}</video> : <button type="button" className="media-enlarge" onClick={() => setSelected(item)} aria-label={`Enlarge project image ${i + 1}`}><img loading="lazy" src={item.url} alt={item.alt}/></button>}<figcaption>{item.caption || item.alt}</figcaption></figure>)}</div><dialog ref={dialog} className="image-dialog" aria-label="Project image" onClose={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) dialog.current.close(); }}><button autoFocus type="button" className="image-close" aria-label="Close image" onClick={() => dialog.current.close()}>×</button>{selected && <figure><img src={selected.url} alt={selected.alt}/><figcaption>{selected.caption || selected.alt}</figcaption></figure>}</dialog></section>;
}
function ProjectDetail({ project }) {
  useEffect(() => { document.title = `${project?.name || 'Project'} — Bhavya Dosi`; return () => { document.title = SITE_TITLE; }; }, [project]);
  if (!project) return <main id="main" tabIndex="-1" className="project-detail"><a href="#/projects">← All projects</a><h1>Project not found</h1><p>You can find all my work in the project gallery.</p></main>;
  const next = projects[(projects.findIndex(p => p.id === project.id) + 1) % projects.length];
  return <main id="main" tabIndex="-1" className="project-detail">
    <a className="back-link" href="#/projects">← All projects</a>
    <header className="detail-header">
      <div className="detail-meta"><span>{categoryOf(project)}</span><span>{project.status}</span></div>
      <h1>{project.name}</h1><p>{project.summary}</p>
      <div className="detail-actions">{(project.repo || project.link) && <a className="subtle-button" href={project.repo || project.link} target="_blank" rel="noreferrer">{project.repo ? 'View on GitHub' : project.linkLabel || 'Project website'} <Arrow /></a>}{project.documents?.map(doc => <a className="subtle-button" key={doc.href} href={doc.href}>{doc.label} <span aria-hidden="true">→</span></a>)}</div>
      <div className="tags">{project.stack?.map(item => <span key={item}>{item}</span>)}</div>
    </header>
    {!!project.facts?.length && <ul className="facts" role="list" aria-label="Key figures" style={{ '--facts': Math.min(project.facts.length, 4) }}>{project.facts.map(fact => <li key={fact.label}><strong>{fact.value}</strong><span>{fact.label}</span></li>)}</ul>}
    <MediaGallery project={project}/>
    <section className="detail-overview"><h2>Overview</h2><p>{project.description}</p>{!!project.highlights?.length && <ul>{project.highlights.map(item => <li key={item}>{item}</li>)}</ul>}</section>
    {project.role && <section className="detail-overview"><h2>My role</h2><p>{project.role}</p></section>}
    {!!project.updates?.length && <section className="detail-overview"><h2>Current stage</h2><ul>{project.updates.map(item => <li key={item.date + item.text}><time dateTime={item.date}>{item.date}</time> — {item.text}</li>)}</ul></section>}
    {!!project.relatedLinks?.length && <section className="detail-overview"><h2>{project.relatedTitle || 'Datasets & supporting work'}</h2><ul>{project.relatedLinks.map(item => <li key={item.url}><a className="text-link" href={item.url} target="_blank" rel="noreferrer">{item.label} <Arrow /></a></li>)}</ul></section>}
    {definitions[project.id] && <Schematic projectId={project.id}/>}
    <a className="next-project" href={`#/project/${next.id}`}><span>Next project</span><strong>{next.name} <span aria-hidden="true">→</span></strong></a>
  </main>;
}
export default function App() {
  const route = useRoute();
  const requestedId = route.startsWith('#/project/') ? route.slice(10) : null;
  const projectId = requestedId === 'p1' ? 'act-training' : requestedId;
  const studyId = route.startsWith('#/study/') ? route.slice(8) : null;
  return <><a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a><Header/>{projectId !== null ? <ProjectDetail key={projectId} project={projects.find(p => p.id === projectId)}/> : studyId !== null ? <TradeStudy key={studyId} id={studyId} siteTitle={SITE_TITLE}/> : <Home/>}<footer className="site-footer shell"><span>Bhavya Dosi</span><span>Built with curiosity. Always in progress.</span><a href="#/">Back to top ↑</a></footer></>;
}
