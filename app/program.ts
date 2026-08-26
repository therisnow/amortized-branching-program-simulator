export type Bit = 0 | 1;
export type Branch = "accept" | "reject";

export type ProgramNode = {
  id: string;
  family: "forward" | "accept-reverse" | "reject-reverse" | "aux";
  stage: "p1" | "p2" | "aux";
  level: number;
  fn: number;
  copy: number;
  query?: 0 | 1;
  terminal?: boolean;
  x: number;
  y: number;
  label: string;
  detail: string;
};

export type ProgramEdge = {
  id: string;
  from: string;
  to: string;
  bit?: Bit;
  kind: "query" | "middle" | "bridge" | "aux";
  query?: 0 | 1;
};

export type Program = {
  nodes: ProgramNode[];
  edges: ProgramEdge[];
  nodeById: Map<string, ProgramNode>;
  outgoing: Map<string, ProgramEdge[]>;
  sourceIds: string[];
  unusedMiddleTarget: string;
};

export type Trace = {
  nodeIds: string[];
  edgeIds: string[];
  output: Bit;
  recoveredCopy: number | null;
};

const COPIES = [8, 4, 1] as const;
const FORWARD_X = [90, 280, 500, 720, 940, 1160] as const;
const REVERSE_X = [1370, 1580, 1790, 2000, 2210, 2420] as const;
const WIDTH = 2520;
const HEIGHT = 1740;

export const VIEWBOX = `0 0 ${WIDTH} ${HEIGHT}`;
export const SOURCE_COLORS = [
  "#0072B2",
  "#D55E00",
  "#009E73",
  "#CC79A7",
  "#E69F00",
  "#56B4E9",
  "#7A4EAB",
  "#5B6472",
] as const;

const countFunctions = (variables: number) => 1 << (1 << variables);
const truthSize = (variables: number) => 1 << variables;

export function valueAt(fn: number, variables: number, input: number): Bit {
  const shift = truthSize(variables) - 1 - input;
  return ((fn >> shift) & 1) as Bit;
}

export function truthTable(fn: number, variables: number): string {
  return Array.from({ length: truthSize(variables) }, (_, input) =>
    valueAt(fn, variables, input),
  ).join("");
}

export function supportText(fn: number, variables: number): string {
  if (variables === 0) return fn === 1 ? "{ε}" : "∅";
  const width = variables;
  const members = Array.from({ length: truthSize(variables) }, (_, input) => input)
    .filter((input) => valueAt(fn, variables, input) === 1)
    .map((input) => input.toString(2).padStart(width, "0"));
  return members.length ? `{${members.join(",")}}` : "∅";
}

function restrictFunction(fn: number, variables: number, bit: Bit): number {
  let result = 0;
  for (let y = 0; y < truthSize(variables - 1); y += 1) {
    result = (result << 1) | valueAt(fn, variables, (y << 1) | bit);
  }
  return result;
}

function middleFunction(g: number, f: number): number {
  return (~(g ^ f)) & 0b1111;
}

function nodeId(stage: "p1" | "p2", level: number, fn: number, copy: number) {
  return `${stage}-l${level}-f${fn}-c${copy}`;
}

function reverseId(branch: Branch, originalId: string) {
  return `${branch === "accept" ? "a" : "r"}-rev-${originalId}`;
}

function evenlySpaced(index: number, total: number, top: number, bottom: number) {
  if (total === 1) return (top + bottom) / 2;
  return top + (index * (bottom - top)) / (total - 1);
}

function describe(stage: "p1" | "p2", level: number, fn: number, copy: number) {
  const table = truthTable(fn, level);
  return `${stage === "p1" ? "Part 1" : "Part 2"} · level ${level} · truth table ${table} · support ${supportText(fn, level)} · copy ${copy + 1}`;
}

export function buildProgram(fTable: string): Program {
  const f = Number.parseInt(fTable, 2);
  const nodes: ProgramNode[] = [];
  const edges: ProgramEdge[] = [];
  const sourceIds: string[] = [];

  const addNode = (node: ProgramNode) => nodes.push(node);
  const addEdge = (edge: Omit<ProgramEdge, "id">) => {
    edges.push({ ...edge, id: `e${edges.length}` });
  };

  const forwardLayers: Array<{ stage: "p1" | "p2"; level: number; ids: string[] }> = [];

  for (let level = 0; level <= 2; level += 1) {
    const labels = Array.from(
      { length: countFunctions(level) - 1 },
      (_, index) => index + 1,
    );
    const layerNodes: string[] = [];
    const total = labels.length * COPIES[level];
    let position = 0;
    for (const fn of labels) {
      for (let copy = 0; copy < COPIES[level]; copy += 1) {
        const id = nodeId("p1", level, fn, copy);
        addNode({
          id,
          family: "forward",
          stage: "p1",
          level,
          fn,
          copy,
          query: level < 2 ? (level as 0 | 1) : undefined,
          terminal: false,
          x: FORWARD_X[level],
          y: evenlySpaced(position, total, 120, 1600),
          label: level === 0 ? `s${copy + 1}` : truthTable(fn, level),
          detail: describe("p1", level, fn, copy),
        });
        layerNodes.push(id);
        if (level === 0) sourceIds.push(id);
        position += 1;
      }
    }
    forwardLayers.push({ stage: "p1", level, ids: layerNodes });
  }

  for (let level = 2; level >= 0; level -= 1) {
    const labels = Array.from({ length: countFunctions(level) }, (_, fn) => fn);
    if (level === 0) labels.sort((a, b) => b - a);
    const layerNodes: string[] = [];
    const total = labels.length * COPIES[level];
    let position = 0;
    for (const fn of labels) {
      for (let copy = 0; copy < COPIES[level]; copy += 1) {
        const id = nodeId("p2", level, fn, copy);
        addNode({
          id,
          family: "forward",
          stage: "p2",
          level,
          fn,
          copy,
          query: level > 0 ? ((level - 1) as 0 | 1) : undefined,
          terminal: level === 0,
          x: FORWARD_X[5 - level],
          y: evenlySpaced(position, total, 80, 1640),
          label: level === 0 ? `${fn === 1 ? "A′" : "R′"}${copy + 1}` : truthTable(fn, level),
          detail: describe("p2", level, fn, copy),
        });
        layerNodes.push(id);
        position += 1;
      }
    }
    forwardLayers.push({ stage: "p2", level, ids: layerNodes });
  }

  for (let level = 1; level <= 2; level += 1) {
    for (let g = 1; g < countFunctions(level - 1); g += 1) {
      for (const bit of [0, 1] as Bit[]) {
        const targets: string[] = [];
        for (let h = 1; h < countFunctions(level); h += 1) {
          if (restrictFunction(h, level, bit) !== g) continue;
          for (let copy = 0; copy < COPIES[level]; copy += 1) {
            targets.push(nodeId("p1", level, h, copy));
          }
        }
        for (let copy = 0; copy < COPIES[level - 1]; copy += 1) {
          addEdge({
            from: nodeId("p1", level - 1, g, copy),
            to: targets[copy],
            bit,
            kind: "query",
            query: (level - 1) as 0 | 1,
          });
        }
      }
    }
  }

  const middleTargets = new Set<string>();
  for (let g = 1; g < 16; g += 1) {
    const h = middleFunction(g, f);
    const target = nodeId("p2", 2, h, 0);
    middleTargets.add(target);
    addEdge({
      from: nodeId("p1", 2, g, 0),
      to: target,
      kind: "middle",
    });
  }
  const unusedMiddleTarget = Array.from({ length: 16 }, (_, h) => nodeId("p2", 2, h, 0)).find(
    (id) => !middleTargets.has(id),
  )!;

  for (let level = 2; level >= 1; level -= 1) {
    for (let g = 0; g < countFunctions(level - 1); g += 1) {
      for (const bit of [0, 1] as Bit[]) {
        const sources: string[] = [];
        for (let h = 0; h < countFunctions(level); h += 1) {
          if (restrictFunction(h, level, bit) !== g) continue;
          for (let copy = 0; copy < COPIES[level]; copy += 1) {
            sources.push(nodeId("p2", level, h, copy));
          }
        }
        for (let copy = 0; copy < COPIES[level - 1]; copy += 1) {
          addEdge({
            from: sources[copy],
            to: nodeId("p2", level - 1, g, copy),
            bit,
            kind: "query",
            query: (level - 1) as 0 | 1,
          });
        }
      }
    }
  }

  const forwardNodes = [...nodes];
  const forwardEdges = [...edges];
  for (const branch of ["accept", "reject"] as Branch[]) {
    const top = branch === "accept" ? 60 : 940;
    const bottom = branch === "accept" ? 800 : 1680;
    const family = branch === "accept" ? "accept-reverse" : "reject-reverse";
    const auxId = `${branch}-aux`;
    addNode({
      id: auxId,
      family,
      stage: "aux",
      level: -1,
      fn: 0,
      copy: 0,
      terminal: true,
      x: 2490,
      y: branch === "accept" ? 835 : 1700,
      label: "aux",
      detail: "Unreachable auxiliary terminal used only to complete missing reverse edges.",
    });

    const layerGroups = [
      forwardLayers.find((layer) => layer.stage === "p2" && layer.level === 0)!,
      forwardLayers.find((layer) => layer.stage === "p2" && layer.level === 1)!,
      forwardLayers.find((layer) => layer.stage === "p2" && layer.level === 2)!,
      forwardLayers.find((layer) => layer.stage === "p1" && layer.level === 2)!,
      forwardLayers.find((layer) => layer.stage === "p1" && layer.level === 1)!,
      forwardLayers.find((layer) => layer.stage === "p1" && layer.level === 0)!,
    ];
    layerGroups.forEach((group, column) => {
      group.ids.forEach((id, index) => {
        const original = forwardNodes.find((node) => node.id === id)!;
        const reverseQuery: 0 | 1 | undefined =
          original.stage === "p2" && original.level === 0
            ? 0
            : original.stage === "p2" && original.level === 1
              ? 1
              : original.stage === "p1" && original.level === 2
                ? 1
                : original.stage === "p1" && original.level === 1
                  ? 0
                  : undefined;
        addNode({
          ...original,
          id: reverseId(branch, id),
          family,
          query: reverseQuery,
          terminal: original.stage === "p1" && original.level === 0,
          x: REVERSE_X[column],
          y: evenlySpaced(index, group.ids.length, top, bottom),
          label:
            original.stage === "p1" && original.level === 0
              ? `${branch === "accept" ? "a" : "r"}${original.copy + 1}`
              : original.label,
          detail: `${branch === "accept" ? "Accept" : "Reject"} reverse copy · ${original.detail}`,
        });
      });
    });

    const desiredOutput: Bit = branch === "accept" ? 1 : 0;
    for (let copy = 0; copy < 8; copy += 1) {
      addEdge({
        from: nodeId("p2", 0, desiredOutput, copy),
        to: reverseId(branch, nodeId("p2", 0, desiredOutput, copy)),
        kind: "bridge",
      });
    }

    for (const edge of forwardEdges) {
      addEdge({
        from: reverseId(branch, edge.to),
        to: reverseId(branch, edge.from),
        bit: edge.bit,
        kind: edge.kind === "middle" ? "middle" : "query",
        query: edge.query,
      });
    }

    const reverseNodes = nodes.filter((node) => node.family === family && node.query !== undefined);
    for (const node of reverseNodes) {
      const present = new Set(
        edges.filter((edge) => edge.from === node.id && edge.bit !== undefined).map((edge) => edge.bit),
      );
      for (const bit of [0, 1] as Bit[]) {
        if (!present.has(bit)) {
          addEdge({ from: node.id, to: auxId, bit, kind: "aux", query: node.query });
        }
      }
    }
    const reverseMiddleSource = reverseId(branch, unusedMiddleTarget);
    if (!edges.some((edge) => edge.from === reverseMiddleSource)) {
      addEdge({ from: reverseMiddleSource, to: auxId, kind: "aux" });
    }
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, ProgramEdge[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.from) ?? [];
    list.push(edge);
    outgoing.set(edge.from, list);
  }
  return { nodes, edges, nodeById, outgoing, sourceIds, unusedMiddleTarget };
}

export function traceProgram(program: Program, sourceIndex: number, input: string): Trace {
  const bits = input.split("").map(Number) as Bit[];
  let current = program.sourceIds[sourceIndex];
  const nodeIds = [current];
  const edgeIds: string[] = [];
  let guard = 0;
  while (guard < 40) {
    guard += 1;
    const choices = program.outgoing.get(current) ?? [];
    if (choices.length === 0) break;
    const node = program.nodeById.get(current)!;
    let edge: ProgramEdge | undefined;
    if (node.query !== undefined) {
      edge = choices.find((candidate) => candidate.bit === bits[node.query!]);
    } else {
      edge = choices.find((candidate) => candidate.bit === undefined) ?? choices[0];
    }
    if (!edge) break;
    edgeIds.push(edge.id);
    current = edge.to;
    nodeIds.push(current);
  }
  const tempNode = nodeIds.map((id) => program.nodeById.get(id)!).find(
    (node) => node.family === "forward" && node.stage === "p2" && node.level === 0,
  );
  const finalNode = program.nodeById.get(nodeIds[nodeIds.length - 1]);
  return {
    nodeIds,
    edgeIds,
    output: (tempNode?.fn ?? 0) as Bit,
    recoveredCopy:
      finalNode?.terminal && finalNode.stage === "p1" ? finalNode.copy : null,
  };
}

export function verifyProgram(program: Program, fTable: string, inputs: string[]) {
  const f = Number.parseInt(fTable, 2);
  const traces = inputs.map((input, source) => traceProgram(program, source, input));
  const outputsCorrect = traces.every((trace, source) => {
    const input = Number.parseInt(inputs[source], 2);
    return trace.output === valueAt(f, 2, input);
  });
  const indicesRecovered = traces.every((trace, source) => trace.recoveredCopy === source);
  const forwardQueryNodes = program.nodes.filter(
    (node) => node.family === "forward" && node.query !== undefined,
  );
  const outdegreeValid = forwardQueryNodes.every((node) => {
    const queryEdges = (program.outgoing.get(node.id) ?? []).filter((edge) => edge.bit !== undefined);
    return queryEdges.length === 2 && new Set(queryEdges.map((edge) => edge.bit)).size === 2;
  });
  const fixedBitInjective = ["p1", "p2"].every((stage) =>
    [0, 1].every((bit) => {
      const targets = program.edges
        .filter(
          (edge) =>
            edge.kind === "query" &&
            edge.bit === bit &&
            program.nodeById.get(edge.from)?.family === "forward" &&
            program.nodeById.get(edge.from)?.stage === stage,
        )
        .map((edge) => edge.to);
      return new Set(targets).size === targets.length;
    }),
  );
  return { traces, outputsCorrect, indicesRecovered, outdegreeValid, fixedBitInjective };
}
