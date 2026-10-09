import React from 'react';
import MediaThumb from './MediaThumb.jsx';

// One project on the home page. The whole card is a single link to the case study; HIVE (`lead`) spans both columns on wide screens.
export default function ProjectCard({ project, lead = false }) {
  const titleId = `card-${project.id}-title`, summaryId = `card-${project.id}-summary`, statusId = `card-${project.id}-status`;
  return <article className={lead ? 'project-card lead' : 'project-card'}>
    <a href={`#/project/${project.id}`} aria-labelledby={titleId} aria-describedby={`${statusId} ${summaryId}`}>
      <div className="card-cover"><MediaThumb media={project.card} autoPlay /></div>
      <div className="card-content">
        <div className="card-title"><h3 id={titleId}>{project.name}</h3><span aria-hidden="true">↗</span></div>
        <p className="card-status" id={statusId}>{project.status}</p>
        <p className="card-summary" id={summaryId}>{project.summary}</p>
        <ul className="chips" role="list">{project.chips.map(chip => <li key={chip}>{chip}</li>)}</ul>
        <p className="card-role">{project.role}</p>
        <ul className="domains" role="list" aria-label="Domains">{project.domains.map(domain => <li key={domain}>{domain}</li>)}</ul>
      </div>
    </a>
  </article>;
}
