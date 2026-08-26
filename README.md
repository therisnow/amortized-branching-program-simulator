# Amortized Branching Program Simulator (n = 2)

[English](README.md) | [简体中文](README.zh-CN.md)

Designed for research and teaching, this interactive, beginner-friendly simulator visualizes the construction in Aaron Potechin's paper [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4) (2017).

**[Open the live simulator](https://therisnow.github.io/amortized-branching-program-simulator/)**

## What question does it illustrate?

A branching program computes by following edges labeled by input bits. Its size is the total number of vertices in the graph.

If we compute the same Boolean function many times, the obvious method is to copy one branching program many times. Potechin instead lets many sources share one static network while preserving separate outputs. With sufficiently many copies, the average size per copy becomes linear in the input length.

This simulator shows the complete **n = 2** case: four possible inputs (`00`, `01`, `10`, `11`) and eight formal sources.

## How to use and read it

1. Choose the target function `f` by editing its four truth-table values.
2. Choose an input for each colored source path.
3. Press **Play**, or move one step at a time with the controls.
4. Follow a colored path through four stages:
   - **Part 1** routes the source to a Boolean function `g` satisfying `g(x) = 1`.
   - The **middle map** replaces `g` by `h`, where `h(y) = 1` exactly when `g(y) = f(y)`. Hence `h(x) = f(x)`.
   - **Part 2** evaluates `h(x)` and reaches a temporary accept or reject vertex.
   - The **reverse network** restores the original source index while preserving the result.
5. Click any vertex to inspect the state represented there.

The simulator lets different colored paths use different inputs so that cross-input sharing is easy to see. In the formal repeated-computation definition, all sources are evaluated on one common input at a time.

```text
source identity -> shared forward routing -> compute f(x) -> reverse routing -> same identity + correct output
```

## Run the simulator

- **Online:** open the [GitHub Pages version](https://therisnow.github.io/amortized-branching-program-simulator/).
- **Portable:** download `PotechinSimulator-Portable.zip` from [Release v1.0.0](https://github.com/therisnow/amortized-branching-program-simulator/releases/tag/v1.0.0), unzip it, and open `index.html`.
- **From source:** install [Node.js](https://nodejs.org/) 22.13 or later and pnpm, then run:

```bash
pnpm install
pnpm dev
```

## Related papers

- Aaron Potechin, [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4) (2017).
- Vincent Girard, Michal Koucký, and Pierre McKenzie, [*Nonuniform Catalytic Space and the Direct Sum for Space*](https://eccc.weizmann.ac.il/report/2015/138/) (2015).
- James Cook and Ian Mertz, [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8) (2022).
