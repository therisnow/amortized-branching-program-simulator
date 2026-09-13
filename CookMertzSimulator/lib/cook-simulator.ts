export type Bit = 0 | 1;
export type Schedule = 'gray' | 'naive';

export type Config = {
  input: Bit[];
  tauInput: Bit[];
  tauMonomial: Bit[][];
  tauOutput: Bit;
  schedule: Schedule;
};

export type RegisterState = {
  inputRegisters: Bit[];
  monomialRegisters: Bit[][];
  outputRegister: Bit;
  queryCount: number;
  currentT: number;
};

export type OutputTerm = {
  s: number;
  sPrime: number;
  firstSubset: number;
  secondSubset: number;
  coefficient: Bit;
  tauFactor: Bit;
  firstFactor: Bit;
  secondFactor: Bit;
  value: Bit;
};

export type Frame = {
  index: number;
  round: number | null;
  t: number;
  nextT?: number;
  kind: 'initial' | 'output' | 'query' | 'monomial';
  phase: string;
  title: string;
  instruction: string;
  explanation: string;
  group?: number;
  variable?: number;
  subset?: number;
  queriedBit?: Bit;
  outputDelta?: Bit;
  outputTerms?: OutputTerm[];
  state: RegisterState;
};

export type Trace = {
  frames: Frame[];
  expectedOutput: Bit;
  finalOutput: Bit;
  registersRestored: boolean;
  queryCount: number;
  toggleCount: number;
};

export const GROUPS = [[0, 1], [2, 3]] as const;
export const NONEMPTY_SUBSETS = [1, 2, 3];
export const GRAY_SETS = [0, 1, 3, 2];
export const GRAY_CHANGED_GROUPS = [0, 1, 0, 1];
export const NAIVE_SETS = [0, 1, 2, 3];

export const DEFAULT_CONFIG: Config = {
  input: [1, 1, 1, 1],
  tauInput: [0, 1, 0, 1],
  tauMonomial: [[0, 1, 1], [1, 1, 0]],
  tauOutput: 1,
  schedule: 'gray',
};

const asBit = (value: number): Bit => (value & 1) as Bit;

function cloneState(state: RegisterState): RegisterState {
  return {
    inputRegisters: [...state.inputRegisters],
    monomialRegisters: state.monomialRegisters.map((group) => [...group]),
    outputRegister: state.outputRegister,
    queryCount: state.queryCount,
    currentT: state.currentT,
  };
}

function product(values: Bit[], indices: readonly number[]): Bit {
  return indices.reduce<Bit>((result, index) => asBit(result & values[index]), 1);
}

export function members(mask: number, size: number, offset = 0): number[] {
  return Array.from({ length: size }, (_, index) => index + offset).filter(
    (_, index) => ((mask >> index) & 1) === 1,
  );
}

export function setLabel(mask: number, size: number, offset = 0): string {
  const values = members(mask, size, offset).map((index) => index + 1);
  return values.length === 0 ? '∅' : `{${values.join(',')}}`;
}

export const tLabel = (mask: number) => setLabel(mask, 2);
export const localLabel = (group: number, subset: number) => setLabel(subset, 2, group * 2);

function localMask(globalMask: number, group: number): number {
  const [first, second] = GROUPS[group];
  return ((globalMask >> first) & 1) | (((globalMask >> second) & 1) << 1);
}

function registerIndex(subset: number): number {
  return subset - 1;
}

export function yValues(config: Config): Bit[] {
  return config.tauInput.map((value, index) => asBit(value ^ config.input[index]));
}

export function zValue(config: Config, group: number, subset: number): Bit {
  const indices = GROUPS[group].filter((_, index) => ((subset >> index) & 1) === 1);
  return asBit(config.tauMonomial[group][registerIndex(subset)] ^ product(yValues(config), indices));
}

function outputTerms(state: RegisterState, config: Config, t: number): OutputTerm[] {
  return Array.from({ length: 16 }, (_, sPrime) => {
    const s = 15 ^ sPrime;
    const firstSubset = localMask(sPrime, 0);
    const secondSubset = localMask(sPrime, 1);
    const blocksWithNonemptySubset = (firstSubset === 0 ? 0 : 1) | (secondSubset === 0 ? 0 : 2);
    const coefficient = asBit((t & ~blocksWithNonemptySubset) === 0 ? 1 : 0);
    const tauFactor = product(config.tauInput, members(s, 4));
    const firstFactor = firstSubset === 0 ? 1 : state.monomialRegisters[0][registerIndex(firstSubset)];
    const secondFactor = secondSubset === 0 ? 1 : state.monomialRegisters[1][registerIndex(secondSubset)];
    return {
      s,
      sPrime,
      firstSubset,
      secondSubset,
      coefficient,
      tauFactor,
      firstFactor,
      secondFactor,
      value: asBit(coefficient & tauFactor & firstFactor & secondFactor),
    };
  });
}

const outputDelta = (terms: OutputTerm[]) => terms.reduce<Bit>((result, term) => asBit(result ^ term.value), 0);

function pushFrame(frames: Frame[], state: RegisterState, frame: Omit<Frame, 'index' | 'state'>) {
  frames.push({ ...frame, index: frames.length, state: cloneState(state) });
}

function toggleGroup(
  frames: Frame[],
  state: RegisterState,
  config: Config,
  round: number,
  t: number,
  nextT: number,
  group: number,
) {
  const variables = GROUPS[group];

  variables.forEach((variable) => {
    const before = state.inputRegisters[variable];
    state.inputRegisters[variable] = asBit(before ^ config.input[variable]);
    state.queryCount += 1;
    pushFrame(frames, state, {
      round, t, nextT, kind: 'query', group, variable, queriedBit: config.input[variable],
      phase: 'ToggleInputForGroup：计算 y',
      title: `读取 x${variable + 1}，更新 R${variable + 1}ⁱⁿ`,
      instruction: `R_${variable + 1}^in ← R_${variable + 1}^in + x_${variable + 1}`,
      explanation: `${before} + ${config.input[variable]} = ${state.inputRegisters[variable]}。本块第一次读取后，输入寄存器依次变为 y_i = τ_i^in + x_i。`,
    });
  });

  NONEMPTY_SUBSETS.forEach((subset) => {
    const indices = variables.filter((_, index) => ((subset >> index) & 1) === 1);
    const monomial = product(state.inputRegisters, indices);
    const index = registerIndex(subset);
    const before = state.monomialRegisters[group][index];
    state.monomialRegisters[group][index] = asBit(before ^ monomial);
    pushFrame(frames, state, {
      round, t, nextT, kind: 'monomial', group, subset,
      phase: 'ToggleMonomialsForGroup：更新块内单项式',
      title: `更新 R${group + 1},${localLabel(group, subset)}`,
      instruction: `R_${group + 1},${localLabel(group, subset)} ← R_${group + 1},${localLabel(group, subset)} + ∏_{i∈${localLabel(group, subset)}}R_i^in`,
      explanation: `${before} + ${monomial} = ${state.monomialRegisters[group][index]}。这里不查询输入，只使用刚刚得到的输入寄存器值。`,
    });
  });

  variables.forEach((variable, position) => {
    const before = state.inputRegisters[variable];
    state.inputRegisters[variable] = asBit(before ^ config.input[variable]);
    state.queryCount += 1;
    if (position === variables.length - 1) state.currentT = nextT;
    pushFrame(frames, state, {
      round, t, nextT, kind: 'query', group, variable, queriedBit: config.input[variable],
      phase: 'ToggleInputForGroup：恢复输入寄存器',
      title: `再次读取 x${variable + 1}，恢复 R${variable + 1}ⁱⁿ`,
      instruction: `R_${variable + 1}^in ← R_${variable + 1}^in + x_${variable + 1}`,
      explanation: `${before} + ${config.input[variable]} = ${state.inputRegisters[variable]}。第二次读取撤销第一次读取的影响。`,
    });
  });
}

function updateOutput(frames: Frame[], state: RegisterState, config: Config, round: number, t: number) {
  const terms = outputTerms(state, config, t);
  const delta = outputDelta(terms);
  const before = state.outputRegister;
  state.outputRegister = asBit(before ^ delta);
  pushFrame(frames, state, {
    round, t, kind: 'output',
    phase: 'Algorithm 3：输出更新',
    title: `加入 T = ${tLabel(t)} 对应的部分`,
    instruction: 'R^out ← R^out + Σ_{S,S′⊆[4]} d_{S,S′,T}(∏_{i∈S}R_i^in)(∏_{j=1}^2R_{j,S′_j})',
    explanation: `${before} + ${delta} = ${state.outputRegister}。输出更新不读取输入；下表给出全部 16 个 S′ 的系数和实际值。`,
    outputDelta: delta,
    outputTerms: terms,
  });
}

function initialState(config: Config): RegisterState {
  return {
    inputRegisters: [...config.tauInput],
    monomialRegisters: config.tauMonomial.map((group) => [...group]),
    outputRegister: config.tauOutput,
    queryCount: 0,
    currentT: 0,
  };
}

export function buildTrace(config: Config): Trace {
  const state = initialState(config);
  const frames: Frame[] = [];
  let toggleCount = 0;
  pushFrame(frames, state, {
    round: null, t: 0, kind: 'initial', phase: '初始化',
    title: '所有寄存器从任意催化初值开始',
    instruction: 'R_i^in = τ_i^in, R_{j,S′_j} = τ_{j,S′_j}, R^out = τ^out',
    explanation: '尚未读取输入。按照 Note 12，空集寄存器已经删除，因此每块只保留三个非空单项式寄存器。',
  });

  if (config.schedule === 'gray') {
    GRAY_SETS.forEach((t, round) => {
      updateOutput(frames, state, config, round, t);
      const nextT = GRAY_SETS[(round + 1) % GRAY_SETS.length];
      toggleGroup(frames, state, config, round, t, nextT, GRAY_CHANGED_GROUPS[round]);
      toggleCount += 1;
    });
  } else {
    NAIVE_SETS.forEach((t, round) => {
      [0, 1].forEach((group) => {
        if (((t >> group) & 1) === 1) {
          toggleGroup(frames, state, config, round, state.currentT, state.currentT | (1 << group), group);
          toggleCount += 1;
        }
      });
      updateOutput(frames, state, config, round, t);
      [1, 0].forEach((group) => {
        if (((t >> group) & 1) === 1) {
          toggleGroup(frames, state, config, round, state.currentT, state.currentT & ~(1 << group), group);
          toggleCount += 1;
        }
      });
    });
  }

  const functionValue = asBit(config.input.reduce<number>((result, value) => result & value, 1));
  const expectedOutput = asBit(config.tauOutput ^ functionValue);
  const registersRestored = state.inputRegisters.every((value, index) => value === config.tauInput[index])
    && state.monomialRegisters.every((group, groupIndex) => group.every((value, index) => value === config.tauMonomial[groupIndex][index]));

  return {
    frames,
    expectedOutput,
    finalOutput: state.outputRegister,
    registersRestored,
    queryCount: state.queryCount,
    toggleCount,
  };
}
