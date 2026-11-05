import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AcademicResource } from '../../types';

interface Props {
  subject: string;
  semester?: string;
  resources: AcademicResource[]; // already filtered by subject + semester
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  unitCount?: number; // syllabus units, default 5
}

interface GNode {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  count: number;
  avgRating: number;
  topics: string[];
  items: AcademicResource[];
  isRoot?: boolean;
}

const W = 640;
const H = 470;
const STOP = new Set(['and', 'the', 'of', 'in', 'to', 'for', 'unit', 'notes', 'with', 'a']);

const words = (s: string) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));

// split a long subject name into short lines that fit inside the centre circle
const wrapLabel = (text: string, maxChars = 12, maxLines = 4): string[] => {
  const lines: string[] = [];
  let cur = '';
  text.split(/\s+/).forEach(w => {
    if ((cur + ' ' + w).trim().length <= maxChars) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines - 1);
    const rest = lines.slice(maxLines - 1).join(' ');
    kept.push(rest.length > maxChars ? rest.slice(0, maxChars - 1) + '…' : rest);
    return kept;
  }
  return lines;
};

// colour by average rating: pale (few/low) -> deep teal (high), like the "Created on" scale
const shade = (rating: number, count: number) => {
  if (count === 0) return '#e2e8f0';
  const t = Math.min(1, Math.max(0, (rating - 3) / 2));
  const l = 78 - t * 40;
  return `hsl(175, 45%, ${l}%)`;
};

export const SubjectGraph: React.FC<Props> = ({
  subject, semester, resources, selectedUnit, onSelectUnit, unitCount = 5,
}) => {
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const drag = useRef<{ id: string; moved: boolean } | null>(null);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});

  const { nodes, edges } = useMemo(() => {
    const units = Array.from({ length: unitCount }, (_, i) => `Unit ${i + 1}`);
    const nodes: GNode[] = units.map(u => {
      const rs = resources.filter(r => r.unit === u || r.unit === 'All Units');
      const own = rs.length;
      return {
        id: u,
        label: u,
        x: 0, y: 0,
        r: 18 + Math.min(own, 8) * 3,
        count: own,
        avgRating: own ? rs.reduce((a, r) => a + r.rating, 0) / own : 0,
        topics: rs.flatMap(r => words(r.topic || r.title)),
        items: rs,
      };
    });

    // edges: root->unit, unit chain (syllabus order), + shared-topic links
    const edges: { a: number; b: number; w: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      if (i > 0) edges.push({ a: i, b: i - 1, w: 0.6 });
      for (let j = i + 2; j < nodes.length; j++) {
        const shared = nodes[i].topics.filter(t => nodes[j].topics.includes(t)).length;
        if (shared) edges.push({ a: i, b: j, w: Math.min(1, shared / 3) });
      }
    }

    // root node
    const root: GNode = {
      id: '__root', label: subject, x: W / 2, y: H / 2 + 10, r: 56,
      count: resources.length, avgRating: 0, topics: [], items: [], isRoot: true,
    };
    const all = [root, ...nodes];
    const rootEdges = nodes.map((_, i) => ({ a: 0, b: i + 1, w: 0.4 }));
    const allEdges = [...rootEdges, ...edges.map(e => ({ a: e.a + 1, b: e.b + 1, w: e.w }))];

    // deterministic start: ring, then a small force simulation
    all.slice(1).forEach((n, i) => {
      const ang = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      n.x = W / 2 + Math.cos(ang) * 150;
      n.y = H / 2 + Math.sin(ang) * 130;
    });
    for (let it = 0; it < 220; it++) {
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const dx = all[j].x - all[i].x, dy = all[j].y - all[i].y;
          const d = Math.max(20, Math.hypot(dx, dy));
          const f = 7000 / (d * d);
          all[i].x -= (dx / d) * f; all[i].y -= (dy / d) * f;
          all[j].x += (dx / d) * f; all[j].y += (dy / d) * f;
        }
      }
      for (const e of allEdges) {
        const A = all[e.a], B = all[e.b];
        const dx = B.x - A.x, dy = B.y - A.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const target = A.isRoot || B.isRoot ? 175 : 120;
        const f = (d - target) * 0.02 * (0.5 + e.w);
        if (!A.isRoot) { A.x += (dx / d) * f; A.y += (dy / d) * f; }
        if (!B.isRoot) { B.x -= (dx / d) * f; B.y -= (dy / d) * f; }
      }
      all.forEach(n => {
        if (n.isRoot) return;
        n.x = Math.min(W - n.r - 20, Math.max(n.r + 20, n.x));
        n.y = Math.min(H - n.r - 28, Math.max(n.r + 62, n.y)); // keep node + its label inside the box
      });
    }
    return { nodes: all, edges: allEdges };
  }, [resources, subject, unitCount]);

  // reset dragged positions whenever the layout is recomputed
  useEffect(() => {
    const m: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => (m[n.id] = { x: n.x, y: n.y }));
    setPos(m);
  }, [nodes]);

  const P = (n: GNode) => pos[n.id] || { x: n.x, y: n.y };
  const neighbours = (id: string | null) => {
    const set = new Set<string>();
    if (!id) return set;
    set.add(id);
    edges.forEach(e => {
      if (nodes[e.a].id === id) set.add(nodes[e.b].id);
      if (nodes[e.b].id === id) set.add(nodes[e.a].id);
    });
    return set;
  };
  const near = neighbours(hover);

  const toSvg = (ev: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.min(W - 20, Math.max(20, q.x)), y: Math.min(H - 20, Math.max(20, q.y)) };
  };
  const placeTip = (id: string, ev: React.PointerEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setTip({ id, x: ev.clientX - r.left, y: ev.clientY - r.top });
  };
  const onMove = (ev: React.PointerEvent) => {
    if (!drag.current) { if (hover) placeTip(hover, ev); return; }
    setTip(null);
    drag.current.moved = true;
    const q = toSvg(ev);
    setPos(prev => ({ ...prev, [drag.current!.id]: q }));
  };
  const onUp = () => { setTimeout(() => { drag.current = null; }, 0); };

  const tipNode = tip ? nodes.find(n => n.id === tip.id) : null;
  const tipInfo = tipNode && (() => {
    const byType: Record<string, number> = {};
    tipNode.items.forEach(r => { byType[r.resourceType] = (byType[r.resourceType] || 0) + 1; });
    const top = [...tipNode.items].sort((a, b) => b.rating - a.rating)[0];
    const downloads = tipNode.items.reduce((a, r) => a + r.downloadCount, 0);
    const topics = Array.from(new Set(tipNode.topics)).slice(0, 4);
    return { byType, top, downloads, topics };
  })();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Syllabus map · {subject}</h3>
          <p className="text-[11px] text-slate-500">
            {semester ? `Semester ${semester} · ` : ''}Bigger node = more resources. Darker = higher rated. Drag nodes to explore. Tap a unit to open its notes.
          </p>
        </div>
        {selectedUnit && (
          <button
            onClick={() => onSelectUnit('')}
            className="text-[11px] font-semibold text-indigo-600 hover:underline whitespace-nowrap"
          >
            Clear unit
          </button>
        )}
      </div>

      <div ref={wrapRef} className="relative">
      <svg ref={svgRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} style={{ touchAction: 'none' }} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Unit graph for ${subject}`}>
        {edges.map((e, i) => {
          const A = nodes[e.a], B = nodes[e.b];
          const pa = P(A), pb = P(B);
          const active = hover && (A.id === hover || B.id === hover);
          return (
            <line
              key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={active ? '#0f766e' : '#94a3b8'}
              strokeOpacity={hover ? (active ? 0.95 : 0.08) : 0.25 + e.w * 0.35}
              strokeWidth={(active ? 1.5 : 1) + e.w * 2.5}
            />
          );
        })}
        {nodes.map(n => {
          const selected = n.id === selectedUnit;
          const p = P(n);
          const dim = hover && !near.has(n.id);
          return (
            <g
              key={n.id}
              opacity={dim ? 0.3 : 1}
              style={{ cursor: n.isRoot ? 'default' : 'pointer' }}
              onPointerEnter={ev => { if (!n.isRoot) { setHover(n.id); placeTip(n.id, ev); } }}
              onPointerLeave={() => { setHover(null); setTip(null); }}
              onPointerDown={ev => { if (!n.isRoot) { (ev.target as Element).setPointerCapture?.(ev.pointerId); drag.current = { id: n.id, moved: false }; } }}
              onClick={() => { if (!n.isRoot && !drag.current?.moved) onSelectUnit(n.id); }}
            >
              <circle
                cx={p.x} cy={p.y} r={n.r}
                style={n.isRoot ? { fill: 'var(--color-indigo-600)' } : undefined}
                fill={n.isRoot ? undefined : shade(n.avgRating, n.count)}
                stroke={selected ? 'var(--sb-select, #1e293b)' : '#fff'}
                strokeWidth={selected ? 3 : 2}
              />
              {n.isRoot ? (
                <text textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                  {wrapLabel(n.label).map((line, i, arr) => (
                    <tspan key={i} x={p.x} y={p.y + 4 + (i - (arr.length - 1) / 2) * 13}>
                      {line}
                    </tspan>
                  ))}
                </text>
              ) : (
                <>
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="700"
                    fill={n.count ? '#fff' : '#64748b'}>
                    {n.count}
                  </text>
                  <text x={p.x} y={p.y + n.r + 14} textAnchor="middle" fontSize="11"
                    fontWeight={selected || hover === n.id ? 700 : 500} style={{ fill: 'var(--sb-label, #334155)' }}>
                    {n.label}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {tip && tipNode && tipInfo && (
        <div
          className="pointer-events-none absolute z-20 w-56 rounded-lg bg-slate-900/95 text-white shadow-xl p-3 text-[11px] leading-snug"
          style={{
            left: tip.x > (wrapRef.current?.clientWidth || 0) * 0.6 ? tip.x - 236 : tip.x + 16,
            top: Math.max(0, tip.y - 20),
          }}
        >
          <p className="text-xs font-bold">{tipNode.label}</p>
          {tipNode.count === 0 ? (
            <p className="text-slate-300 mt-1">No material yet. Tap to open and be the first to upload.</p>
          ) : (
            <>
              <p className="text-slate-300 mt-0.5">
                {tipNode.count} resource{tipNode.count === 1 ? '' : 's'} · ★ {tipNode.avgRating.toFixed(1)} avg · {tipInfo.downloads} downloads
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(tipInfo.byType).map(([t, c]) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-white/15">{t} {c}</span>
                ))}
              </div>
              {tipInfo.top && (
                <p className="mt-2">
                  <span className="text-slate-400">Top rated:</span> {tipInfo.top.title}
                </p>
              )}
              {tipInfo.topics.length > 0 && (
                <p className="mt-1 text-slate-400">Topics: {tipInfo.topics.join(', ')}</p>
              )}
            </>
          )}
          <p className="mt-2 text-teal-300 font-semibold">Tap to open notes →</p>
        </div>
      )}
      </div>
    </div>
  );
};
