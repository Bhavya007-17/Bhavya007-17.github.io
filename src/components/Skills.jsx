import React, { useState } from 'react';

const HINT = 'Hover or focus a skill to see which projects show it. Each skill opens the first of those projects.';

// Three skill groups. Every skill is a pill that links to the first project that shows it;
// hovering or focusing it lists all of them.
export default function Skills({ groups = [], projects = [] }) {
  const [active, setActive] = useState(null);
  const nameOf = id => projects.find(project => project.id === id)?.name;
  const namesFor = item => item.projects.map(nameOf).filter(Boolean);
  const proof = item => `${item.name} — shown in ${namesFor(item).join(', ')}`;
  const activate = item => ({ onMouseEnter: () => setActive(item), onFocus: () => setActive(item), onMouseLeave: () => setActive(null), onBlur: () => setActive(null) });

  return <section id="skills" className="skills-section shell" aria-labelledby="skills-title">
    <div className="section-title"><div><h2 id="skills-title">What I work with</h2><p>Skills I have used in the projects above, not a keyword list.</p></div></div>
    <div className="skill-groups">{groups.map(group => <div className="skill-group" key={group.group}>
      <h3>{group.group}</h3>
      <ul role="list">{group.items.map(item => {
        const id = `skill-${group.group}-${item.name}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        const target = item.projects[0];
        return <li key={item.name}>
          <a className="skill" href={`#/project/${target}`} aria-describedby={id} {...activate(item)}>{item.name}</a>
          <span className="sr-only" id={id}>Shown in {namesFor(item).join(', ')}</span>
        </li>;
      })}</ul>
    </div>)}</div>
    <p className="skill-proof" aria-hidden="true">{active ? proof(active) : HINT}</p>
  </section>;
}
