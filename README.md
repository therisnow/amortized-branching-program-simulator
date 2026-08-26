# Amortized Branching Program Simulator (n = 2)

[English](README.md) | [简体中文](README.zh-CN.md)

This is an interactive, beginner-friendly visualization of the construction in Aaron Potechin's paper [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4) (2017).

**[Open the live simulator](https://therisnow.github.io/potechin-bp-simulator/)**

## What question does it illustrate?

A branching program computes by following edges labeled by input bits. Its size is the total number of vertices in the graph.

If we want to compute the same Boolean function many times, the obvious method is to place many independent copies of one branching program side by side. Potechin's construction shows that a large common network can do much better: many source copies can share the same static graph while still ending at their own accept or reject terminals. For sufficiently many copies, the average number of vertices per copy is only linear in the input length.

The full construction is very large. This simulator fixes **n = 2**, so the inputs are `00`, `01`, `10`, and `11`, and the construction has **8 formal sources**. It is small enough to draw while still containing every major part of the argument.

## A first five-minute tour

1. Choose the target function `f` by editing its four truth-table values.
2. Choose an input for each colored source path.
3. Press **Play**, or move one step at a time with the controls.
4. Follow one colored path from its source through the forward network.
5. Check whether it enters the accept or reject side, then watch the reverse network return it to the terminal with the same source index.
6. Click any vertex to inspect the state represented there.

The simulator lets different colored paths use different inputs so that cross-input sharing is easy to see. In the formal repeated-computation definition, all sources are evaluated on one common input at a time.

## How to read the graph

The network is easiest to understand as four stages.

### 1. Part 1: encode a source into a Boolean function

Each source begins with an identity that must eventually be recovered. As the program reads `x1` and `x2`, Part 1 routes the source to a vertex labeled by a Boolean function `g` whose truth table satisfies `g(x) = 1` for the current input `x`.

Different sources reach different physical vertices for the same fixed input. Across different inputs, however, paths may reuse vertices. This is where the graph obtains its sharing.

### 2. Middle map: insert the target function

Part 1 itself is independent of the function we want to compute. The middle map is the only target-dependent step. It replaces `g` by a new Boolean function `h` defined pointwise by

```text
h(y) = 1  exactly when  g(y) = f(y).
```

Because Part 1 guarantees `g(x) = 1`, this definition gives `h(x) = f(x)`. The map from `g` to `h` is reversible, so it does not merge source identities.

### 3. Part 2: evaluate the new function

Part 2 reads the input again and evaluates the truth-table entry `h(x)`. Since `h(x) = f(x)`, the path reaches a temporary accept vertex when `f(x) = 1` and a temporary reject vertex when `f(x) = 0`.

### 4. Reverse network: restore the source index

The forward network computes the right bit but may permute the source identities. The accept and reject sides therefore contain reversed copies of the forward routing network. A path carries its computed result into the appropriate reverse copy and retraces the input-dependent permutation. It finally arrives at the accept or reject terminal bearing its original source index.

In short:

```text
source identity -> shared forward routing -> compute f(x) -> reverse routing -> same identity + correct output
```

## What the colors mean

- Colored overlays show the eight currently active source paths.
- Static edges marked `x_i = 0` and `x_i = 1` show the two possible branches at a query vertex.
- Green terminal vertices mean value `1` / accept.
- Red terminal vertices mean value `0` / reject.
- Gray `aux` vertices are structural endpoints that the active construction does not reach.

You can hide or show static edges and active paths independently. The correctness panel checks the structural and output conditions while you experiment.

## Ways to run it

### Online — easiest

Open [the GitHub Pages version](https://therisnow.github.io/potechin-bp-simulator/). Nothing needs to be installed, and the simulator does not upload your choices.

### Portable offline version

If a portable package is available on the repository's [Releases page](https://github.com/therisnow/potechin-bp-simulator/releases), download `PotechinSimulator-Portable.zip`, unzip it, and open `index.html`. It does not require Node.js, PowerShell, or a local server. Keep `THIRD_PARTY_LICENSES.txt` with the HTML file when redistributing it.

### Run from source

Install [Node.js](https://nodejs.org/) 22.13 or later and pnpm, then run:

```bash
pnpm install
pnpm dev
```

On Windows, `Start-PotechinSimulator.ps1` provides the same local-development shortcut. The production and portable builds can be checked with:

```bash
pnpm run check
pnpm run build
pnpm run build:portable
```

## Scope

This project is an educational reconstruction of the `n = 2` case. It is intended to make the routing idea visible; it is not a proof assistant and does not replace the definitions and proof in the paper.

## Related papers

- Aaron Potechin, [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4) (2017).
- Vincent Girard, Michal Koucký, and Pierre McKenzie, [*Nonuniform Catalytic Space and the Direct Sum for Space*](https://eccc.weizmann.ac.il/report/2015/138/) (2015).
- James Cook and Ian Mertz, [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8) (2022).

## Contact

- Source: [therisnow/potechin-bp-simulator](https://github.com/therisnow/potechin-bp-simulator)
- Email: [daiy0928@cs.msu.ru](mailto:daiy0928@cs.msu.ru)
