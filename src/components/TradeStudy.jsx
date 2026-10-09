import React, { useEffect } from 'react';
import studies from '../data/tradeStudies.json';
import content from '../data/projects.json';

const { projects } = content;
// Half-up rounding that ignores binary floating-point noise (3.035 must read 3.04, not 3.03).
const round2 = value => Math.round((value + 1e-9) * 100) / 100;
const fmt2 = value => round2(value).toFixed(2);
const fmtScore = value => Number(value).toFixed(1);
const percent = value => `${Math.round(value * 100)}%`;
const isNumeric = value => /^[\d.]/.test(value);

// Weighted sum of the criterion scores. This is the only place totals are computed.
function weightedTotal(scores, weights, criteria) {
  return criteria.reduce((sum, criterion) => sum + (scores?.[criterion.id] ?? 0) * (weights?.[criterion.id] ?? 0), 0);
}
// Competition ranking: equal totals share a rank (1, 2, 3, 4, 4, 6).
function rankOf(total, totals) {
  const key = Math.round(total * 1e6);
  return 1 + totals.filter(other => Math.round(other * 1e6) > key).length;
}
function Table({ caption, children, className = '' }) {
  return <div className="table-wrap" role="region" aria-label={caption} tabIndex={0}><table className={className}><caption>{caption}</caption>{children}</table></div>;
}
function Bullets({ items }) {
  return <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>;
}

export default function TradeStudy({ id, siteTitle }) {
  const study = studies[id];
  useEffect(() => {
    document.title = `${study?.title || 'Study not found'} — Bhavya Dosi`;
    return () => { document.title = siteTitle; };
  }, [study, siteTitle]);
  if (!study) return <main id="main" tabIndex="-1" className="trade-study"><a className="back-link" href="#/">← Home</a><h1>Study not found</h1><p className="study-lede">There is no trade study at this address. You can find my work on the home page.</p></main>;

  const project = projects.find(p => p.id === study.projectId);
  const { criteria, weightSets, options, propertyColumns } = study;
  const baseline = weightSets.find(set => set.id === 'baseline') || weightSets[0];
  const results = options.map(option => {
    const byWeightSet = Object.fromEntries(weightSets.map(set => [set.id, weightedTotal(study.scores[option.id], set.weights, criteria)]));
    return { option, byWeightSet };
  });
  const totalsFor = setId => results.map(row => row.byWeightSet[setId]);
  const ranked = [...results].sort((a, b) => Math.round(b.byWeightSet[baseline.id] * 1e6) - Math.round(a.byWeightSet[baseline.id] * 1e6)); // ties keep data order
  const baselineTotals = totalsFor(baseline.id);
  const topBaseline = Math.max(...baselineTotals);
  const backLabel = project ? `← ${project.name}` : '← Projects';
  const backHref = project ? `#/project/${project.id}` : '#/projects';

  return <main id="main" tabIndex="-1" className="trade-study">
    <a className="back-link" href={backHref}>{backLabel}</a>
    <header className="study-header">
      <span className="study-eyebrow">Trade study · {study.date}</span>
      <h1>{study.title}</h1>
      <p className="study-subtitle">{study.subtitle}</p>
      <p className="study-lede">{study.summary}</p>
    </header>

    <section className="study-section" aria-labelledby="study-question"><h2 id="study-question">Question</h2><p>{study.question}</p></section>
    <section className="study-section" aria-labelledby="study-context"><h2 id="study-context">Context</h2><Bullets items={study.context} /></section>

    <section className="study-section" aria-labelledby="study-options"><h2 id="study-options">Options</h2>
      <ul className="option-grid">{options.map(option => <li key={option.id}><h3>{option.name}</h3><p>{option.note}</p></li>)}</ul>
    </section>

    <section className="study-section" aria-labelledby="study-properties"><h2 id="study-properties">Material properties</h2>
      <Table caption="Typical datasheet values">
        <thead><tr><th scope="col">Material</th>{propertyColumns.map(column => <th scope="col" key={column.key} className={isNumeric(study.properties[options[0].id][column.key]) ? 'num' : ''}>{column.label}{column.unit && <span className="unit">{column.unit}</span>}</th>)}</tr></thead>
        <tbody>{options.map(option => <tr key={option.id}><th scope="row">{option.short}</th>{propertyColumns.map(column => { const value = study.properties[option.id][column.key]; return <td key={column.key} className={isNumeric(value) ? 'num' : ''}>{value}</td>; })}</tr>)}</tbody>
      </Table>
    </section>

    <section className="study-section" aria-labelledby="study-scoring"><h2 id="study-scoring">Scoring</h2>
      <p>Each criterion is scored from 1 to 5, higher is better. The total is the sum of score × weight using the “{baseline.label}” weights. Rows are ordered by total.</p>
      <Table caption="Scores and weighted totals" className="scoring">
        <thead><tr><th scope="col">Material</th>{criteria.map(criterion => <th scope="col" key={criterion.id} className="num">{criterion.name}<span className="unit">{percent(baseline.weights[criterion.id] ?? 0)}</span></th>)}<th scope="col" className="num">Total<span className="unit">weighted sum</span></th></tr></thead>
        <tbody>{ranked.map(({ option, byWeightSet }) => {
          const total = byWeightSet[baseline.id];
          const top = Math.round(total * 1e6) === Math.round(topBaseline * 1e6);
          return <tr key={option.id} className={top ? 'top' : undefined}><th scope="row">{option.short}</th>{criteria.map(criterion => <td key={criterion.id} className="num">{fmtScore(study.scores[option.id][criterion.id])}</td>)}<td className="num total">{fmt2(total)}</td></tr>;
        })}</tbody>
      </Table>
      <dl className="criteria">{criteria.map(criterion => <div key={criterion.id}><dt>{criterion.name}</dt><dd>{criterion.basis}</dd></div>)}</dl>
    </section>

    <section className="study-section" aria-labelledby="study-sensitivity"><h2 id="study-sensitivity">Sensitivity to weights</h2>
      <p>The same scores under each weight set. The best total in each column is highlighted.</p>
      <Table caption="Total and rank by weight set" className="sensitivity">
        <thead><tr><th scope="col">Material</th>{weightSets.map(set => <th scope="col" key={set.id} className="num">{set.label}</th>)}</tr></thead>
        <tbody>{ranked.map(({ option, byWeightSet }) => <tr key={option.id}><th scope="row">{option.short}</th>{weightSets.map(set => {
          const total = byWeightSet[set.id], rank = rankOf(total, totalsFor(set.id));
          return <td key={set.id} className={rank === 1 ? 'num best' : 'num'}><span className="figure">{fmt2(total)}</span> <span className="rank"><span className="sr-only">rank </span>#{rank}</span></td>;
        })}</tr>)}</tbody>
      </Table>
    </section>

    <section className="study-section" aria-labelledby="study-result"><h2 id="study-result">Result</h2>{study.result.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>
    <section className="study-section callout" aria-labelledby="study-recommendation"><h2 id="study-recommendation">Recommendation</h2><p>{study.recommendation}</p></section>
    <section className="study-section" aria-labelledby="study-limitations"><h2 id="study-limitations">Limitations</h2><Bullets items={study.limitations} /></section>
    <section className="study-section" aria-labelledby="study-method"><h2 id="study-method">Method</h2><Bullets items={study.method} /></section>
    <section className="study-section" aria-labelledby="study-sources"><h2 id="study-sources">Sources</h2><Bullets items={study.sources} /></section>
    <a className="next-project" href={backHref}><span>Back to the project</span><strong>{project ? project.name : 'All projects'} <span aria-hidden="true">→</span></strong></a>
  </main>;
}
