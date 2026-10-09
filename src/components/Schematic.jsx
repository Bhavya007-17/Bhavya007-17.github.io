import React, { useEffect, useId, useRef, useState } from 'react';
import definitions from '../data/schematics.json';
import './Schematic.css';
import SchematicCover from './SchematicCover.jsx';

const positions = [[35, 40], [340, 40], [645, 40], [645, 255], [340, 255], [35, 255]];
const specialPositions = {
  hive: [[35,40],[340,40],[645,40],[340,255],[35,255],[645,255]],
  'ros2-micromouse-sync': [[35,40],[340,40],[645,40],[340,255],[645,255],[35,255]],
  'autonomous-drone': [[35,40],[340,40],[645,40],[340,255],[645,255],[35,255]],
  'amphibious-robot': [[35,40],[340,40],[645,40],[645,255],[35,255]],
};
function wrap(text, limit=25) {
  const lines = [];
  for (const word of text.split(' ')) {
    if (!lines.length || lines.at(-1).length + word.length > limit) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  return lines;
}
function Diagram({ definition, projectId, marker }) {
  const nodePositions = specialPositions[projectId] || positions;
  const nodes = Object.fromEntries(definition.nodes.map((node,i)=>[node.id,{...node,x:nodePositions[i][0],y:nodePositions[i][1]}]));
  return <svg className="schematic-full" viewBox="0 0 930 405" role="img" aria-label={`${definition.title}. Numbered connections are explained below.`}>
    <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7" fill="var(--diagram-line, #b9ab9c)" /></marker></defs>
    {definition.edges.map((edge,i)=>{
      const from=nodes[edge.from],to=nodes[edge.to];
      if(!from || !to) return null;
      let sx,sy,ex,ey,d,mx,my;
      if(from.y===to.y){
        const right=to.x>from.x;
        sx=from.x+(right?250:0);sy=from.y+45;ex=to.x+(right?0:250);ey=to.y+45;
        mx=(sx+ex)/2;my=sy;
        if(Math.abs(from.x-to.x)>305){
          my=from.y+115;
          d=`M ${sx} ${sy} H ${sx+(right?24:-24)} V ${my} H ${ex+(right?-24:24)} V ${ey} H ${ex}`;
        } else d=`M ${sx} ${sy} L ${ex} ${ey}`;
      } else {
        const down=to.y>from.y;
        sx=from.x+125;sy=from.y+(down?90:0);ex=to.x+125;ey=to.y+(down?0:90);
        if(definition.edges.some((other,j)=>j<i && other.from===edge.to && other.to===edge.from)){sx+=44;ex+=44;}
        my=(sy+ey)/2;mx=(sx+ex)/2;
        d=`M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`;
      }
      return <g key={`${edge.from}-${edge.to}`}><path d={d} fill="none" className={i===0 ? "sc-flow" : undefined} stroke="var(--diagram-line, #b9ab9c)" strokeWidth="2" markerEnd={`url(#${marker})`}/><circle cx={mx} cy={my} r="10" fill="var(--surface, #292724)"/><text x={mx} y={my+4} textAnchor="middle" fontSize="13" fill="var(--red-ink, #ff7a72)">{i+1}</text></g>;
    })}
    {Object.values(nodes).map((node,i)=>{
      const lines=wrap(node.label);
      return <g key={node.id}><rect x={node.x} y={node.y} width="250" height="90" rx="5" fill="var(--diagram-node, #302e2b)" stroke="var(--diagram-line, #b9ab9c)"/><text x={node.x+15} y={node.y+22} fontSize="13" fill="var(--diagram-line, #b9ab9c)">{String(i+1).padStart(2,'0')}</text><text x={node.x+125} y={node.y+48-(lines.length-1)*8} textAnchor="middle" fontSize="16" fontWeight="500" fill="var(--text, #e9e4dc)">{lines.map((line,j)=><tspan x={node.x+125} dy={j?19:0} key={line}>{line}</tspan>)}</text></g>;
    })}
  </svg>;
}
export default function Schematic({ projectId, compact=false }) {
  const definition=definitions[projectId];
  const marker=useId().replaceAll(':','');
  const dialogRef=useRef(null);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!open) return undefined;
    const dialog=dialogRef.current;
    const previous=document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow='hidden';
    return ()=>{document.body.style.overflow=previous;if(dialog.open)dialog.close();};
  },[open]);
  if(!definition) return null;
  if(compact) return <SchematicCover projectId={projectId} title={definition.title}/>;
  return <section className="schematic-section" aria-label={definition.title}>
    <div className="schematic-heading"><h2>System schematic</h2><span className="schematic-hint"><span className="hint-click">Click to enlarge</span><span className="hint-tap">Tap to enlarge</span></span></div>
    <button type="button" className="schematic-open" onClick={()=>setOpen(true)} aria-label={`Enlarge ${definition.title}`}><Diagram definition={definition} projectId={projectId} marker={marker}/></button>
    <ol className="schematic-mobile-parts" aria-label={`${definition.title} parts`}>{definition.nodes.map((node,i)=><li key={node.id}><span className="part-num" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><h3>{node.label}</h3><p>{node.detail}</p></li>)}</ol>
    <p className="schematic-scope">{definition.scope}</p>
    <dialog ref={dialogRef} className="schematic-dialog" onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)dialogRef.current.close();}} aria-labelledby={`${marker}-title`}>
      <div className="schematic-dialog-header"><div><span>Architecture</span><h2 id={`${marker}-title`}>{definition.title}</h2></div><button type="button" onClick={()=>dialogRef.current.close()} aria-label="Close schematic" autoFocus>×</button></div>
      <div className="schematic-dialog-body"><p className="schematic-pan-hint">Swipe to pan →</p><div className="schematic-scroll"><Diagram definition={definition} projectId={projectId} marker={`${marker}-expanded`}/></div><p className="schematic-scope">{definition.scope}</p><div className="schematic-parts">{definition.nodes.map((node,i)=><div key={node.id}><h3><span>{String(i+1).padStart(2,'0')}</span>{node.label}</h3><p>{node.detail}</p></div>)}</div><details className="schematic-connections"><summary>Connection reference</summary><ol>{definition.edges.map((edge,i)=><li key={i}><strong>{definition.nodes.find(n=>n.id===edge.from)?.label} → {definition.nodes.find(n=>n.id===edge.to)?.label}</strong><span>{edge.label}</span></li>)}</ol></details></div>
    </dialog>
  </section>;
}
