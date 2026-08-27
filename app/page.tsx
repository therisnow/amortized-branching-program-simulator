"use client";

import { useEffect, useMemo, useState } from "react";
import { buildProgram, SOURCE_COLORS, supportText, truthTable, verifyProgram, VIEWBOX, type ProgramEdge, type ProgramNode } from "./program";

const INPUTS = ["00", "01", "10", "11"];
const DEFAULT_INPUTS = ["00", "01", "10", "11", "00", "01", "10", "11"];
const F_LABELS = ["f(00)", "f(01)", "f(10)", "f(11)"];

function edgePath(edge: ProgramEdge, nodeById: Map<string, ProgramNode>) {
  const source = nodeById.get(edge.from)!;
  const target = nodeById.get(edge.to)!;
  const dx = Math.max(40, Math.abs(target.x - source.x) * 0.42);
  const direction = target.x >= source.x ? 1 : -1;
  return `M ${source.x} ${source.y} C ${source.x + direction * dx} ${source.y}, ${target.x - direction * dx} ${target.y}, ${target.x} ${target.y}`;
}

function edgeMidpoint(edge: ProgramEdge, nodeById: Map<string, ProgramNode>) {
  const source = nodeById.get(edge.from)!;
  const target = nodeById.get(edge.to)!;
  const dx = Math.max(40, Math.abs(target.x - source.x) * 0.42);
  const direction = target.x >= source.x ? 1 : -1;
  const control1 = { x: source.x + direction * dx, y: source.y };
  const control2 = { x: target.x - direction * dx, y: target.y };
  return {
    x: (source.x + 3 * control1.x + 3 * control2.x + target.x) / 8,
    y: (source.y + 3 * control1.y + 3 * control2.y + target.y) / 8,
  };
}

function nodeRadius(node: ProgramNode) {
  if (node.stage === "aux") return 8;
  return node.terminal ? 11 : 10;
}

function nodeSemanticClass(node: ProgramNode) {
  if (node.stage === "aux") return "terminal-aux";
  if (node.stage !== "p2" || node.level !== 0) return "";
  return node.fn === 1 ? "terminal-accept" : "terminal-reject";
}

export default function Home() {
  const [fTable, setFTable] = useState("0001");
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showAllEdges, setShowAllEdges] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const program = useMemo(() => buildProgram(fTable), [fTable]);
  const verification = useMemo(() => verifyProgram(program, fTable, inputs), [program, fTable, inputs]);
  const maxStep = Math.max(...verification.traces.map((trace) => trace.nodeIds.length - 1));

  useEffect(() => setStep((value) => Math.min(value, maxStep)), [maxStep]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((value) => {
      if (value >= maxStep) { setPlaying(false); return value; }
      return value + 1;
    }), 850);
    return () => window.clearInterval(timer);
  }, [playing, maxStep]);

  const activeNodes = useMemo(() => {
    const result = new Map<string, number[]>();
    verification.traces.forEach((trace, source) => {
      const id = trace.nodeIds[Math.min(step, trace.nodeIds.length - 1)];
      result.set(id, [...(result.get(id) ?? []), source]);
    });
    return result;
  }, [verification.traces, step]);

  const traversedEdges = useMemo(() => {
    const result = new Map<string, number[]>();
    verification.traces.forEach((trace, source) => trace.edgeIds.slice(0, step).forEach((id) => result.set(id, [...(result.get(id) ?? []), source])));
    return result;
  }, [verification.traces, step]);

  const activeEdgeData = useMemo(() => Array.from(traversedEdges.entries()).map(([edgeId, sources]) => {
    const edge = program.edges.find((candidate) => candidate.id === edgeId)!;
    return { edge, sources, midpoint: edgeMidpoint(edge, program.nodeById) };
  }), [program, traversedEdges]);

  const edgeLabelOffsets = useMemo(() => {
    const groups = new Map<string, string[]>();
    activeEdgeData.forEach(({ edge, midpoint, sources }) => {
      if (edge.bit === undefined || edge.query === undefined) return;
      const positionKey = `${Math.round(midpoint.x)}:${Math.round(midpoint.y)}`;
      sources.forEach((source) => groups.set(positionKey, [...(groups.get(positionKey) ?? []), `${edge.id}-${source}`]));
    });

    const offsets = new Map<string, { x: number; y: number }>();
    groups.forEach((labels) => {
      const columns = labels.length > 4 ? 2 : 1;
      const rows = Math.ceil(labels.length / columns);
      labels.forEach((label, index) => {
        const column = columns === 1 ? 0 : index % 2;
        const row = columns === 1 ? index : Math.floor(index / 2);
        offsets.set(label, {
          x: columns === 1 ? 0 : (column - 0.5) * 50,
          y: (row - (rows - 1) / 2) * 23,
        });
      });
    });
    return offsets;
  }, [activeEdgeData]);

  const selectedNode = selectedNodeId ? program.nodeById.get(selectedNodeId) : undefined;
  const toggleF = (index: number) => {
    setFTable((current) => current.split("").map((bit, i) => i === index ? (bit === "0" ? "1" : "0") : bit).join(""));
    setStep(0); setPlaying(false);
  };
  const updateInput = (source: number, value: string) => {
    setInputs((current) => current.map((input, i) => i === source ? value : input));
    setStep(0); setPlaying(false);
  };

  return (
    <main className="simulator-shell">
      <header className="topbar">
        <div>
          <h1>Amortized Branching Program Simulator <span>(N=2)</span></h1>
          <div className="author-info">
            <span>Interactive visualization of Potechin’s construction for amortized branching programs, <span className="paper-citation">following <a href="https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4" target="_blank" rel="noreferrer"><em>A Note on Amortized Branching Program Complexity</em> (2017)</a>.</span></span>
            <span className="author-links"><span>Source :</span><a href="https://github.com/therisnow/potechin-bp-simulator" target="_blank" rel="noreferrer">GitHub Repository</a><i>·</i><span>Contact Email :</span><a href="mailto:daiy0928@cs.msu.ru">daiy0928@cs.msu.ru</a></span>
          </div>
        </div>
        <div className="status-cluster" aria-label="verification status">
          <span className={verification.outputsCorrect ? "status ok" : "status bad"}>output</span><span className={verification.indicesRecovered ? "status ok" : "status bad"}>index</span><span className={verification.fixedBitInjective ? "status ok" : "status bad"}>injective</span><span className={verification.outdegreeValid ? "status ok" : "status bad"}>degree 2</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="controls panel">
          <SectionHeading number="01" title="Target function" note="Truth-table order: 00, 01, 10, 11" />
          <div className="truth-editor">{F_LABELS.map((label, index) => <button key={label} className={fTable[index] === "1" ? "truth-bit on" : "truth-bit"} onClick={() => toggleF(index)}><small>{label}</small><strong>{fTable[index]}</strong></button>)}</div>
          <p className="formula-line">f = {fTable} · supp(f) = {supportText(Number.parseInt(fTable, 2), 2)}</p>

          <SectionHeading number="02" title="Source inputs" note="Each source may use a different input." extra="inputs-heading" />
          <div className="source-grid">{inputs.map((input, source) => <label key={source} className="source-input"><i style={{ background: SOURCE_COLORS[source] }} /><span>s{source + 1}</span><select value={input} onChange={(event) => updateInput(source, event.target.value)}>{INPUTS.map((candidate) => <option key={candidate}>{candidate}</option>)}</select></label>)}</div>

          <SectionHeading number="03" title="Animation" note="Move one transition at a time." extra="inputs-heading" />
          <div className="transport"><button onClick={() => setStep(0)}>↺</button><button onClick={() => setStep((value) => Math.max(0, value - 1))}>←</button><button className="play" onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button><button onClick={() => setStep((value) => Math.min(maxStep, value + 1))}>→</button></div>
          <input className="step-slider" type="range" min="0" max={maxStep} value={step} onChange={(event) => setStep(Number(event.target.value))} /><div className="step-readout"><span>step {step}</span><span>{maxStep}</span></div>
          <label className="edge-toggle"><input type="checkbox" checked={showAllEdges} onChange={(event) => setShowAllEdges(event.target.checked)} /> show complete static edges</label>
          <nav className="paper-links" aria-label="Related papers">
            <strong>Related papers</strong>
            <a href="https://eccc.weizmann.ac.il/report/2015/138/" target="_blank" rel="noreferrer">
              <span>Girard–Koucký–McKenzie · 2015</span>
              <b>Nonuniform Catalytic Space and the Direct Sum for Space</b>
            </a>
            <a href="https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4" target="_blank" rel="noreferrer">
              <span>Potechin · 2017</span>
              <b>A Note on Amortized Branching Program Complexity</b>
            </a>
            <a href="https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8" target="_blank" rel="noreferrer">
              <span>Cook–Mertz · 2022</span>
              <b>Trading Time and Space in Catalytic Branching Programs</b>
            </a>
          </nav>
        </aside>

        <section className="graph-panel panel">
          <div className="graph-toolbar">
            <strong>Complete static program</strong>
            <div className="graph-legend" aria-label="Graph legend">
              <span className="legend-item"><i className="legend-node accept" />1 / accept</span>
              <span className="legend-item"><i className="legend-node reject" />0 / reject</span>
              <span className="legend-item"><i className="legend-node aux" />unreachable aux</span>
              <span className="legend-item"><i className="legend-line bit-zero" />read 0</span>
              <span className="legend-item"><i className="legend-line bit-one" />read 1</span>
              <span className="legend-item"><i className="legend-line interface" />fixed interface</span>
              <span className="legend-item"><i className="legend-line active" />active source path</span>
              <span className="legend-hint">Click a vertex for details.</span>
            </div>
          </div>
          <div className="graph-scroll"><svg viewBox={VIEWBOX} className="program-svg" role="img" aria-label="Complete n equals 2 branching program">
            <defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="context-stroke" /></marker></defs>
            <g className="stage-labels"><text x="90" y="32">8 sources</text><text x="280" y="32">Part 1 · L1</text><text x="500" y="32">Part 1 · full</text><text x="720" y="32">middle / Part 2 · L2</text><text x="940" y="32">Part 2 · L1</text><text x="1160" y="32">temporary outputs</text><text x="1370" y="32">accept reverse</text><text x="1370" y="910">reject reverse</text><text x="2420" y="32">recovered indices</text></g>
            <g className={showAllEdges ? "static-edges" : "static-edges hidden-static"}>{program.edges.map((edge) => <path key={edge.id} d={edgePath(edge, program.nodeById)} className={`edge ${edge.kind} ${edge.bit === undefined ? "" : `bit-${edge.bit}`}`} markerEnd="url(#arrow)" />)}</g>
            <g className="active-edges">{activeEdgeData.flatMap(({ edge, sources, midpoint }) => sources.map((source, index) => { const edgeOffset = (index - (sources.length - 1) / 2) * 18; const inputLabel = edge.bit !== undefined && edge.query !== undefined ? `x${edge.query + 1}=${edge.bit}` : null; const labelOffset = edgeLabelOffsets.get(`${edge.id}-${source}`) ?? { x: 0, y: 0 }; return <g key={`${edge.id}-${source}`}><path d={edgePath(edge, program.nodeById)} transform={`translate(0 ${edgeOffset})`} stroke={SOURCE_COLORS[source]} className="active-edge" markerEnd="url(#arrow)" />{inputLabel && <g className="edge-input-label" transform={`translate(${midpoint.x + labelOffset.x} ${midpoint.y + labelOffset.y})`}><rect x="-21" y="-9" width="42" height="18" rx="5" fill={SOURCE_COLORS[source]} /><text y="3.5">{inputLabel}</text></g>}</g>; }))}</g>
            <g className="nodes">{program.nodes.map((node) => { const active = activeNodes.get(node.id) ?? []; return <g key={node.id} transform={`translate(${node.x} ${node.y})`} className={`node ${node.family} ${nodeSemanticClass(node)} ${node.id === program.unusedMiddleTarget ? "unused" : ""}`} onClick={() => setSelectedNodeId(node.id)} tabIndex={0} role="button" aria-label={node.detail}><circle r={nodeRadius(node)} /><text y={nodeRadius(node) + 13}>{node.label}</text>{active.map((source, index) => { const angle = Math.PI * 2 * index / Math.max(active.length, 1); return <circle key={source} cx={Math.cos(angle) * 15} cy={Math.sin(angle) * 15} r="4.5" fill={SOURCE_COLORS[source]} className="path-marker" />; })}</g>; })}</g>
          </svg></div>
        </section>

        <aside className="inspector panel">
          <SectionHeading number="04" title="Current paths" note="Current step: previous vertex → current vertex." />
          <div className="trace-list">{verification.traces.map((trace, source) => { const currentIndex = Math.min(step, trace.nodeIds.length - 1); const currentId = trace.nodeIds[currentIndex]; const current = program.nodeById.get(currentId)!; const previous = currentIndex > 0 ? program.nodeById.get(trace.nodeIds[currentIndex - 1])! : null; return <button key={source} className="trace-card" onClick={() => setSelectedNodeId(currentId)}><i style={{ background: SOURCE_COLORS[source] }} /><span><strong>s{source + 1} · x={inputs[source]}</strong><small>{current.stage === "aux" ? "auxiliary vertex" : `${current.stage.toUpperCase()} level ${current.level}`}</small></span><b>{previous ? `${previous.label} → ${current.label}` : `start at ${current.label}`}</b></button>; })}</div>
          <div className="node-inspector"><h3>{selectedNode ? "Selected vertex" : "How to read a vertex"}</h3>{selectedNode ? <><p>{selectedNode.detail}</p>{selectedNode.stage !== "aux" && <dl><dt>Truth table</dt><dd>{truthTable(selectedNode.fn, selectedNode.level)}</dd><dt>Support</dt><dd>{supportText(selectedNode.fn, selectedNode.level)}</dd><dt>Query</dt><dd>{selectedNode.query === undefined ? "no query / interface" : `x${selectedNode.query + 1}`}</dd></dl>}</> : <p>The circle is a physical vertex. Its text is a construction label; the queried variable is reported separately.</p>}</div>
          <div className="verification-box"><h3>Live verification</h3><Verify ok={verification.outputsCorrect} text="all paths output their own f(x)" /><Verify ok={verification.indicesRecovered} text="every reverse path restores its source" /><Verify ok={verification.fixedBitInjective} text="fixed-bit forward transitions are injective" /><Verify ok={verification.outdegreeValid} text="every forward query vertex has 0/1 edges" /></div>
        </aside>
      </section>
    </main>
  );
}

function SectionHeading({ number, title, note, extra = "" }: { number: string; title: string; note: string; extra?: string }) { return <div className={`section-heading ${extra}`}><span>{number}</span><div><h2>{title}</h2><p>{note}</p></div></div>; }
function Verify({ ok, text }: { ok: boolean; text: string }) { return <p><span className={ok ? "check" : "cross"}>{ok ? "✓" : "×"}</span> {text}</p>; }
