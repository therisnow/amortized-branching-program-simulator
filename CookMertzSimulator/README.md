# Cook–Mertz Algorithm 3 Simulator

[English](README.md) | [简体中文](README.zh-CN.md) | [Repository overview](../README.md)

An independent interactive reading aid for the blockwise transparent-register construction behind Theorem 11 of Cook and Mertz's [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8).

**[Open the live simulator](https://therisnow.github.io/amortized-branching-program-simulator/cook-mertz/)** · [Open the Potechin simulator](https://therisnow.github.io/amortized-branching-program-simulator/)

The fixed example has $n=4$, $k=2$, $G_1=\{1,2\}$, $G_2=\{3,4\}$, and $f(x)=x_1x_2x_3x_4$. The page shows both a Gray-code schedule and a restore-after-each-configuration comparison under one playback control. At each step it displays the current calculation and both schedules' register values. The empty-set factor is the constant $1$, so no empty-set register is created.

## Run from source

Install Node.js 22.13 or later, then from the repository root:

```bash
cd CookMertzSimulator
npm ci
npm run dev
```

## Validate and build a local single-file page

```bash
npm run check
npm run verify:simulator
npm run build
npm run build:portable
```

The portable result is `portable/index.html`; open it directly in a modern browser. The verifier checks all 65,536 tested input-and-initial-register configurations for output, restoration, round count, and query count. This is a simulation check, not a formal proof of the general theorem.
