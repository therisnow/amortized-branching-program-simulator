'use client';

import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { Math } from './math';
import {
  buildTrace, DEFAULT_CONFIG, localLabel, members,
  NONEMPTY_SUBSETS,
  type Bit, type Config, type Frame, type Schedule,
} from '../lib/cook-simulator';

function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`native-card ${className}`} {...props} />;
}
function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`native-card-header ${className}`} {...props} />;
}
function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`native-card-content ${className}`} {...props} />;
}
function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`native-card-title ${className}`} {...props}>{children}</h3>;
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
  size?: 'default' | 'icon';
};
function Button({ className = '', variant = 'default', size = 'default', type = 'button', ...props }: ButtonProps) {
  return <button className={`native-button ${variant} ${size} ${className}`} type={type} {...props} />;
}

function flip(value: Bit): Bit {
  return (value ^ 1) as Bit;
}
function copyConfig(config: Config): Config {
  return {
    input: [...config.input],
    tauInput: [...config.tauInput],
    tauMonomial: config.tauMonomial.map((group) => [...group]),
    tauOutput: config.tauOutput,
    schedule: config.schedule,
  };
}
function setTex(mask: number, size: number, offset = 0): string {
  const values = members(mask, size, offset).map((index) => index + 1);
  return values.length === 0 ? '\\varnothing' : `\\{${values.join(',')}\\}`;
}
function localSetTex(group: number, subset: number): string {
  return setTex(subset, 2, group * 2);
}
function instructionTex(frame: Frame): string {
  if (frame.kind === 'initial') {
    return "\\begin{aligned}R_i^{\\mathrm{in}}&=\\tau_i^{\\mathrm{in}},\\\\R_{j,S'_j}&=\\tau_{j,S'_j},\\\\R^{\\mathrm{out}}&=\\tau^{\\mathrm{out}}\\end{aligned}";
  }
  if (frame.kind === 'output') {
    return "\\begin{aligned}R^{\\mathrm{out}}\\leftarrow R^{\\mathrm{out}}&+\\sum_{S,S'\\subseteq[4]}d_{S,S',T_\\ell}\\\\&\\quad\\cdot\\left(\\prod_{i\\in S}R_i^{\\mathrm{in}}\\right)\\left(\\prod_{j=1}^{2}R_{j,S'_j}\\right)\\end{aligned}";
  }
  if (frame.kind === 'query') {
    const variable = (frame.variable ?? 0) + 1;
    return `R_{${variable}}^{\\mathrm{in}}\\leftarrow R_{${variable}}^{\\mathrm{in}}+x_{${variable}}`;
  }
  const group = frame.group ?? 0;
  const subset = frame.subset ?? 1;
  return `R_{${group + 1},${localSetTex(group, subset)}}\\leftarrow R_{${group + 1},${localSetTex(group, subset)}}+\\prod_{i\\in${localSetTex(group, subset)}}R_i^{\\mathrm{in}}`;
}

function StepCalculation({ frame }: { frame: Frame }) {
  if (frame.kind === 'initial') {
    return <div className="step-calculation">
      <Math tex={`(R_1^{\\mathrm{in}},R_2^{\\mathrm{in}},R_3^{\\mathrm{in}},R_4^{\\mathrm{in}})=(${frame.state.inputRegisters.join(',')})`} />
      <Math tex={`(R_{1,\\{1\\}},R_{1,\\{2\\}},R_{1,\\{1,2\\}})=(${frame.state.monomialRegisters[0].join(',')})`} />
      <Math tex={`(R_{2,\\{3\\}},R_{2,\\{4\\}},R_{2,\\{3,4\\}})=(${frame.state.monomialRegisters[1].join(',')}),\\quad R^{\\mathrm{out}}=${frame.state.outputRegister}`} />
    </div>;
  }
  if (frame.kind === 'output') {
    const delta = frame.outputDelta ?? 0;
    const after = frame.state.outputRegister;
    const before = after ^ delta;
    const terms = frame.outputTerms ?? [];
    return <div className="step-calculation output-step-calculation">
      <Math tex={`T_${frame.round ?? 0}=${setTex(frame.t, 2)}`} />
      <div className="output-step-terms">
        {terms.map((term) => {
          const inputIndices = members(term.s, 4);
          const inputNames = inputIndices.length === 0 ? '1' : inputIndices.map((index) => `R_{${index + 1}}^{\\mathrm{in}}`).join('\\cdot ');
          const inputValues = inputIndices.length === 0 ? '1' : inputIndices.map((index) => frame.state.inputRegisters[index]).join('\\cdot ');
          const firstName = term.firstSubset === 0 ? '1' : `R_{1,${localSetTex(0, term.firstSubset)}}`;
          const secondName = term.secondSubset === 0 ? '1' : `R_{2,${localSetTex(1, term.secondSubset)}}`;
          return <Math key={`step-output-${term.sPrime}`} tex={`S'=${setTex(term.sPrime, 4)}:\\quad d_{${setTex(term.s, 4)},${setTex(term.sPrime, 4)},T_${frame.round ?? 0}}(${inputNames})(${firstName})(${secondName})=${term.coefficient}\\cdot(${inputValues})\\cdot${term.firstFactor}\\cdot${term.secondFactor}=${term.value}`} />;
        })}
      </div>
      <Math tex={`R^{\\mathrm{out}}=${before}+(${terms.map((term) => term.value).join('+')})=${before}+${delta}=${after}`} />
    </div>;
  }
  if (frame.kind === 'query') {
    const variable = frame.variable ?? 0;
    const bit = frame.queriedBit ?? 0;
    const after = frame.state.inputRegisters[variable];
    const before = after ^ bit;
    return <div className="step-calculation">
      <Math tex={`R_{${variable + 1}}^{\\mathrm{in}}=${before}+x_{${variable + 1}}`} />
      <Math tex={`=${before}+${bit}=${after}`} />
    </div>;
  }
  const group = frame.group ?? 0;
  const subset = frame.subset ?? 1;
  const indices = members(subset, 2, group * 2);
  const monomial = indices.reduce((value, index) => value & frame.state.inputRegisters[index], 1);
  const after = frame.state.monomialRegisters[group][subset - 1];
  const before = after ^ monomial;
  const registerProduct = indices.map((index) => `R_{${index + 1}}^{\\mathrm{in}}`).join('\\cdot ');
  const valueProduct = indices.map((index) => frame.state.inputRegisters[index]).join('\\cdot ');
  return <div className="step-calculation">
    <Math tex={`\\prod_{i\\in${localSetTex(group, subset)}}R_i^{\\mathrm{in}}=${registerProduct}`} />
    <Math tex={`=${valueProduct}=${monomial}`} />
    <Math tex={`R_{${group + 1},${localSetTex(group, subset)}}=${before}+${monomial}=${after}`} />
  </div>;
}

function BitButton({ label, ariaLabel, value, onClick }: {
  label: ReactNode; ariaLabel: string; value: Bit; onClick: () => void;
}) {
  return (
    <button className="bit-button" onClick={onClick} type="button" aria-label={`${ariaLabel} 当前为 ${value}，点击切换`}>
      <span>{label}</span><strong>{value}</strong>
    </button>
  );
}

function ComparisonStepPane({ label, frame, waiting = false }: { label: string; frame: Frame; waiting?: boolean }) {
  return (
    <section className={`comparison-step-pane ${waiting ? 'is-waiting' : ''}`}>
      <div className="comparison-step-heading">
        <strong>{label}</strong>
        <span>{waiting ? '等待朴素算法完成' : frame.phase}</span>
      </div>
      <Math tex={instructionTex(frame)} display className="current-formula" />
      <StepCalculation frame={frame} />
    </section>
  );
}

function InputRegisters({ grayFrame, naiveFrame }: { grayFrame: Frame; naiveFrame: Frame }) {
  return (
    <Card className="input-register-card">
      <CardHeader className="compact-card-header">
        <CardTitle>输入寄存器</CardTitle>
      </CardHeader>
      <CardContent className="register-grid four">
        {grayFrame.state.inputRegisters.map((value, index) => (
          <div className="register-cell dual-register-cell" key={`input-register-${index}`}>
            <div className={`dual-register-row gray-value ${grayFrame.kind === 'query' && grayFrame.variable === index ? 'is-active' : ''}`}>
              <span>使用 Gray code</span><Math className="register-value-line" tex={`R_{${index + 1}}^{\\mathrm{in}}=${value}`} />
            </div>
            <div className={`dual-register-row naive-value ${naiveFrame.kind === 'query' && naiveFrame.variable === index ? 'is-active' : ''}`}>
              <span>不使用 Gray code</span><Math className="register-value-line" tex={`R_{${index + 1}}^{\\mathrm{in}}=${naiveFrame.state.inputRegisters[index]}`} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LocalRegisters({ grayFrame, naiveFrame, group }: { grayFrame: Frame; naiveFrame: Frame; group: number }) {
  return (
    <Card className="local-register-card">
      <CardHeader className="compact-card-header local-register-header">
        <CardTitle><Math tex={`G_{${group + 1}}=${group === 0 ? '\\{1,2\\}' : '\\{3,4\\}'}`} /></CardTitle>
      </CardHeader>
      <CardContent className="local-register-table">
        <div className="local-register-row">
          <span>使用 Gray code</span>
          {NONEMPTY_SUBSETS.map((subset) => {
            const index = subset - 1;
            const active = grayFrame.kind === 'monomial' && grayFrame.group === group && grayFrame.subset === subset;
            return <Math key={`gray-local-${group}-${subset}`} className={`local-register-value ${active ? 'is-active' : ''}`} tex={`R_{${group + 1},${localSetTex(group, subset)}}=${grayFrame.state.monomialRegisters[group][index]}`} />;
          })}
        </div>
        <div className="local-register-row naive-value">
          <span>不使用 Gray code</span>
          {NONEMPTY_SUBSETS.map((subset) => {
            const index = subset - 1;
            const active = naiveFrame.kind === 'monomial' && naiveFrame.group === group && naiveFrame.subset === subset;
            return <Math key={`naive-local-${group}-${subset}`} className={`local-register-value ${active ? 'is-active' : ''}`} tex={`R_{${group + 1},${localSetTex(group, subset)}}=${naiveFrame.state.monomialRegisters[group][index]}`} />;
          })}
        </div>
        <p className="register-note">当 <Math tex={`S'_{${group + 1}}=\\varnothing`} /> 时因子为 <Math tex="1" />，因此不建立空集寄存器。</p>
      </CardContent>
    </Card>
  );
}

function DebugLine({ active = false, context = false, indent = 0, children }: {
  active?: boolean; context?: boolean; indent?: number; children: ReactNode;
}) {
  return (
    <div className={`debug-line ${active ? 'is-active' : ''} ${context ? 'is-context' : ''}`} style={{ '--debug-indent': indent } as CSSProperties}>
      <span className="debug-line-code">{children}</span>
    </div>
  );
}

function AlgorithmDebugger({ frame, schedule }: {
  frame: Frame;
  schedule: Schedule;
}) {
  const computingInput = frame.kind === 'query' && frame.phase.includes('计算 y');
  const restoringInput = frame.kind === 'query' && frame.phase.includes('恢复输入寄存器');
  const insideToggle = frame.kind === 'query' || frame.kind === 'monomial';
  const nextContainsGroup = frame.group !== undefined && Boolean((frame.nextT ?? frame.t) & (1 << frame.group));
  const outerToggleLine = schedule === 'gray' ? 'A3' : nextContainsGroup ? 'N2' : 'N4';
  const exactLine = frame.kind === 'initial'
    ? schedule === 'gray' ? 'A1' : 'N0'
    : frame.kind === 'output'
      ? schedule === 'gray' ? 'A2' : 'N3'
      : frame.kind === 'monomial' ? 'M4' : computingInput ? 'M2I' : 'M5I';
  const contextLines = new Set<string>();
  if (insideToggle) {
    contextLines.add(outerToggleLine);
    if (computingInput) contextLines.add('M2');
    if (frame.kind === 'monomial') contextLines.add('M3');
    if (restoringInput) contextLines.add('M5');
  }
  const parameters = [
    frame.round === null ? null : `\\ell=${frame.round}`,
    `T_{${frame.round ?? 0}}=${setTex(frame.t, 2)}`,
    frame.group === undefined ? null : `G_j=G_{${frame.group + 1}}`,
    frame.variable === undefined ? null : `i=${frame.variable + 1}`,
    frame.subset === undefined || frame.group === undefined ? null : `S'_${frame.group + 1}=${localSetTex(frame.group, frame.subset)}`,
  ].filter(Boolean).join(',\\;');
  const line = (key: string, children: ReactNode, indent = 0) => (
    <DebugLine key={key} indent={indent} active={exactLine === key} context={contextLines.has(key)}>{children}</DebugLine>
  );

  return (
    <Card className="algorithm-debugger">
      <CardHeader className="compact-card-header">
        <CardTitle>{schedule === 'gray' ? '使用 Gray code' : '不使用 Gray code'}</CardTitle>
        {parameters && <span className="debug-parameters"><Math tex={parameters} /></span>}
      </CardHeader>
      <CardContent className="debug-code">
        <section>
          {schedule === 'gray' ? <>
            {line('A1', <Math tex="\mathbf{for}\;\ell=0,\ldots,2^k-1\;\mathbf{do}" />)}
            {line('A2', <Math tex="R^{\mathrm{out}}\leftarrow R^{\mathrm{out}}+\sum_{S,S'\subseteq[n]}d_{S,S',T_\ell}(\prod_{i\in S}R_i^{\mathrm{in}})(\prod_{j=1}^{k}R_{j,S'_j})" />, 1)}
            {line('A3', <Math tex="\operatorname{ToggleMonomialsForGroup}(G_j)" />, 1)}
          </> : <>
            {line('N0', <Math tex="R_i^{\mathrm{in}}\leftarrow\tau_i^{\mathrm{in}},\quad R_{j,S'_j}\leftarrow\tau_{j,S'_j},\quad R^{\mathrm{out}}\leftarrow\tau^{\mathrm{out}}" />)}
            {line('N1', <Math tex="\mathbf{for}\;T\subseteq[k]\;\mathbf{do}" />)}
            {line('N2', <Math tex="\mathbf{for}\;j\in T:\ \operatorname{ToggleMonomialsForGroup}(G_j)" />, 1)}
            {line('N3', <Math tex="R^{\mathrm{out}}\leftarrow R^{\mathrm{out}}+\sum_{S,S'\subseteq[n]}d_{S,S',T}(\prod_{i\in S}R_i^{\mathrm{in}})(\prod_{j=1}^{k}R_{j,S'_j})" />, 1)}
            {line('N4', <Math tex="\mathbf{for}\;j\in T\ \mathbf{in\ reverse\ order}:\ \operatorname{ToggleMonomialsForGroup}(G_j)" />, 1)}
          </>}
        </section>
        <section>
          <h4><Math tex="\operatorname{ToggleMonomialsForGroup}(G_j)" /></h4>
          {line('M2', <Math tex="\mathbf{for}\;i\in G_j\;\mathbf{do}" />, 1)}
          {line('M2I', <Math tex="R_i^{\mathrm{in}}\leftarrow R_i^{\mathrm{in}}+x_i" />, 2)}
          {line('M3', <Math tex="\mathbf{for}\;\varnothing\ne S'_j\subseteq G_j\;\mathbf{do}" />, 1)}
          {line('M4', <Math tex="R_{j,S'_j}\leftarrow R_{j,S'_j}+\prod_{i\in S'_j}R_i^{\mathrm{in}}" />, 2)}
          {line('M5', <Math tex="\mathbf{for}\;i\in G_j\;\mathbf{do}" />, 1)}
          {line('M5I', <Math tex="R_i^{\mathrm{in}}\leftarrow R_i^{\mathrm{in}}+x_i" />, 2)}
        </section>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [config, setConfig] = useState<Config>(() => copyConfig(DEFAULT_CONFIG));
  const trace = useMemo(() => buildTrace({ ...config, schedule: 'gray' }), [config]);
  const naiveTrace = useMemo(() => buildTrace({ ...config, schedule: 'naive' }), [config]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const finalStep = globalThis.Math.max(trace.frames.length, naiveTrace.frames.length) - 1;
  const grayIndex = globalThis.Math.min(step, trace.frames.length - 1);
  const naiveIndex = globalThis.Math.min(step, naiveTrace.frames.length - 1);
  const frame = trace.frames[grayIndex];
  const naiveFrame = naiveTrace.frames[naiveIndex];
  const grayWaiting = step > trace.frames.length - 1;

  useEffect(() => {
    if (!playing || step >= finalStep) return;
    const timer = window.setTimeout(() => setStep((current) => current + 1), 650);
    return () => window.clearTimeout(timer);
  }, [playing, step, finalStep]);

  function resetPlayback() {
    setStep(0);
    setPlaying(false);
  }
  return (
    <main className="simulator-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Cook–Mertz · Theorem 11 · 独立演示</p>
          <h1>Algorithm 3：分块寄存器与 Gray code</h1>
          <p className="header-formula">固定示例：<Math tex="n=4,\quad k=2,\quad G_1=\{1,2\},\quad G_2=\{3,4\},\quad f(x)=x_1x_2x_3x_4" /></p>
          <a className="sibling-simulator-link" href="https://therisnow.github.io/amortized-branching-program-simulator/">← 查看 Potechin 模拟器</a>
        </div>
        <div className="top-playback">
          <span className="top-step-count">STEP {step} / {finalStep}</span>
          <div className="player">
            <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setStep(0); }} aria-label="回到开头">↺</Button>
            <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setStep((current) => current > 0 ? current - 1 : 0); }} aria-label="上一步">←</Button>
            <Button className="play-button" onClick={() => { if (step >= finalStep) setStep(0); setPlaying((current) => !current); }}>
              <span aria-hidden="true">{playing && step < finalStep ? 'Ⅱ' : '▶'}</span>{playing && step < finalStep ? '暂停' : '播放'}
            </Button>
            <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setStep((current) => current < finalStep ? current + 1 : finalStep); }} aria-label="下一步">→</Button>
            <input aria-label="两种算法的共同执行进度" type="range" min={0} max={finalStep} value={step} onChange={(event) => { setPlaying(false); setStep(Number(event.target.value)); }} />
          </div>
        </div>
      </header>

      <section className="workspace-grid">
        <aside className="control-column">
          <Card>
            <CardHeader className="compact-card-header"><CardTitle>输入</CardTitle></CardHeader>
            <CardContent className="bit-grid">
              {config.input.map((value, index) => <BitButton key={`x-${index}`} label={<Math tex={`x_{${index + 1}}`} />} ariaLabel={`x ${index + 1}`} value={value} onClick={() => {
                setConfig((current) => { const next = copyConfig(current); next.input[index] = flip(next.input[index]); return next; }); resetPlayback();
              }} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="compact-card-header"><CardTitle>任意催化初值</CardTitle><Math tex="\tau" /></CardHeader>
            <CardContent className="catalyst-fields">
              <div><p className="field-label">输入寄存器初值</p><div className="bit-grid">
                {config.tauInput.map((value, index) => <BitButton key={`tau-input-${index}`} label={<Math tex={`\\tau_{${index + 1}}^{\\mathrm{in}}`} />} ariaLabel={`输入寄存器 ${index + 1} 的初值`} value={value} onClick={() => {
                  setConfig((current) => { const next = copyConfig(current); next.tauInput[index] = flip(next.tauInput[index]); return next; }); resetPlayback();
                }} />)}
              </div></div>
              {[0, 1].map((group) => <div key={`tau-group-${group}`}>
                <p className="field-label"><Math tex={`G_{${group + 1}}`} /> 的单项式寄存器</p>
                <div className="bit-grid three">{NONEMPTY_SUBSETS.map((subset) => {
                  const index = subset - 1;
                  return <BitButton key={`tau-${group}-${subset}`} label={<Math tex={`\\tau_{${group + 1},${localSetTex(group, subset)}}`} />} ariaLabel={`第 ${group + 1} 块子集 ${localLabel(group, subset)} 的初值`} value={config.tauMonomial[group][index]} onClick={() => {
                    setConfig((current) => { const next = copyConfig(current); next.tauMonomial[group][index] = flip(next.tauMonomial[group][index]); return next; }); resetPlayback();
                  }} />;
                })}</div>
              </div>)}
              <div><p className="field-label">输出寄存器初值</p><div className="bit-grid one">
                <BitButton label={<Math tex="\tau^{\mathrm{out}}" />} ariaLabel="输出寄存器初值" value={config.tauOutput} onClick={() => {
                  setConfig((current) => ({ ...copyConfig(current), tauOutput: flip(current.tauOutput) })); resetPlayback();
                }} />
              </div></div>
            </CardContent>
          </Card>

          <Card className="output-card compact-output-card">
            <CardHeader className="compact-card-header"><CardTitle>输出寄存器</CardTitle></CardHeader>
            <CardContent className="dual-output-values">
              <div><span>使用 Gray code</span><strong className="output-value">{frame.state.outputRegister}</strong></div>
              <div><span>不使用 Gray code</span><strong className="output-value naive-output">{naiveFrame.state.outputRegister}</strong></div>
            </CardContent>
          </Card>
        </aside>

        <section className="main-column">
          <Card className="instruction-card comparison-instruction-card">
            <CardHeader className="compact-card-header"><CardTitle>两种算法的当前计算</CardTitle></CardHeader>
            <CardContent className="comparison-step-grid">
              <ComparisonStepPane label="使用 Gray code" frame={frame} waiting={grayWaiting} />
              <ComparisonStepPane label="不使用 Gray code" frame={naiveFrame} />
            </CardContent>
          </Card>
          <div className="module-overview-grid">
            <InputRegisters grayFrame={frame} naiveFrame={naiveFrame} />
            <AlgorithmDebugger frame={frame} schedule="gray" />
            <AlgorithmDebugger frame={naiveFrame} schedule="naive" />
            <LocalRegisters grayFrame={frame} naiveFrame={naiveFrame} group={0} />
            <LocalRegisters grayFrame={frame} naiveFrame={naiveFrame} group={1} />
          </div>
        </section>
      </section>
    </main>
  );
}
