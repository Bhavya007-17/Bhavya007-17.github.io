import React, { useEffect } from 'react';
import Gallery, { LightboxProvider, Zoomable } from './Gallery.jsx';

const Arrow = () => <span aria-hidden="true">↗</span>;

// "What: …" / "How: …" / "Result: …" → a small label and the sentence.
function splitLabel(line) {
  const match = /^(What|How|Result):\s*([\s\S]*)$/.exec(line);
  return match ? { label: match[1], text: match[2] } : { label: null, text: line };
}

function Figure({ media, ...props }) {
  return <figure className="case-figure">
    <Zoomable media={media} {...props} />
    {media.caption && <figcaption>{media.caption}</figcaption>}
  </figure>;
}

function Steps({ steps }) {
  return <ol className="steps" role="list">{steps.map((step, index) => <li className={step.media ? 'step has-media' : 'step'} key={`${index}-${step.title}`}>
    <div className="step-text">
      <span className="step-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
    </div>
    {step.media && <Figure media={step.media} autoPlay controls ratio="3 / 2" fit="contain" />}
  </li>)}</ol>;
}

export default function CaseStudy({ project, projects, siteTitle }) {
  useEffect(() => {
    document.title = `${project?.name || 'Project'} — Bhavya Dosi`;
    return () => { document.title = siteTitle; };
  }, [project, siteTitle]);

  if (!project) return <main id="main" tabIndex="-1" className="case"><a className="back-link" href="#/projects">← All projects</a><h1 className="case-missing">Project not found</h1><p>You can find all my work on the projects page.</p></main>;

  const next = projects[(projects.findIndex(item => item.id === project.id) + 1) % projects.length];
  const failures = project.failures || [], upNext = project.next || [], gallery = project.gallery || [];
  const links = project.links || [], documents = project.documents || [];

  return <LightboxProvider>
    <main id="main" tabIndex="-1" className="case">
      <a className="back-link" href="#/projects">← All projects</a>

      <div className="case-hero"><Figure media={project.hero} controls ratio="16 / 9" fit="contain" /></div>

      <header className="case-header">
        <div className="case-meta"><span className="status-chip">{project.status}</span><span className="case-domains">{project.domains.join(' · ')}</span></div>
        <h1>{project.name}</h1>
        <p className="case-summary">{project.summary}</p>
        <dl className="case-facts">
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          <div><dt>Team</dt><dd>{project.team}</dd></div>
          <div><dt>Timeline</dt><dd>{project.timeline}</dd></div>
        </dl>
        {(links.length > 0 || documents.length > 0) && <div className="detail-actions">
          {documents.map(doc => <a className="subtle-button" key={doc.href} href={doc.href}>{doc.label} <span aria-hidden="true">→</span></a>)}
          {links.map(link => <a className="subtle-button" key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} <Arrow /></a>)}
        </div>}
      </header>

      {project.facts?.length > 0 && <ul className="facts" role="list" aria-label="Key figures" style={{ '--facts': Math.min(project.facts.length, 4) }}>
        {project.facts.map(fact => <li key={fact.label}><strong>{fact.value}</strong><span>{fact.label}</span></li>)}
      </ul>}

      <section className="case-section" aria-labelledby="cs-tldr">
        <h2 id="cs-tldr">TL;DR</h2>
        <ul className="tldr" role="list">{project.tldr.map(line => {
          const { label, text } = splitLabel(line);
          return <li key={line}>{label && <strong>{label}</strong>}<span>{text}</span></li>;
        })}</ul>
      </section>

      <section className="case-section" aria-labelledby="cs-problem"><h2 id="cs-problem">Problem</h2><p className="case-prose">{project.problem}</p></section>

      <section className="case-section" aria-labelledby="cs-how"><h2 id="cs-how">How it works</h2><Steps steps={project.steps} /></section>

      <section className="case-section" aria-labelledby="cs-decisions">
        <h2 id="cs-decisions">Design decisions</h2>
        <ul className="decisions" role="list">{project.decisions.map(item => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="case-section" aria-labelledby="cs-results">
        <h2 id="cs-results">Results</h2>
        <ul className="results" role="list">{project.results.map((result, index) => <li key={`${index}-${result.label}`}>
          <strong>{result.value}</strong>
          <span className="result-label">{result.label}</span>
          <small className="result-source">Source: {result.source}</small>
        </li>)}</ul>
      </section>

      {failures.length > 0 && <section className="case-section" aria-labelledby="cs-failures">
        <h2 id="cs-failures">What didn’t work</h2>
        <ul className="failures" role="list">{failures.map((failure, index) => <li className={failure.media ? 'failure has-media' : 'failure'} key={`${index}-${failure.title}`}>
          <div className="failure-text"><h3>{failure.title}</h3><p>{failure.text}</p></div>
          {failure.media && <Figure media={failure.media} autoPlay controls ratio="3 / 2" fit="contain" />}
        </li>)}</ul>
      </section>}

      {upNext.length > 0 && <section className="case-section" aria-labelledby="cs-next">
        <h2 id="cs-next">What’s next</h2>
        <ul className="next-list" role="list">{upNext.map(item => <li key={item}>{item}</li>)}</ul>
      </section>}

      <Gallery items={gallery} />

      <a className="next-project" href={`#/project/${next.id}`}><span>Next project</span><strong>{next.name} <span aria-hidden="true">→</span></strong></a>
    </main>
  </LightboxProvider>;
}
