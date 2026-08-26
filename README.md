# Amortized Branching Program Simulator

Interactive visualization of the reconstructed (n=2) construction from Aaron Potechin, [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4) (2017).

The simulator displays eight independently configured source inputs, all Part 1 and Part 2 physical vertices, the target-function-dependent middle bijection, temporary outputs, complete accepting and rejecting reverse copies, animated colored paths, and live correctness checks.

Repository: [therisnow/potechin-bp-simulator](https://github.com/therisnow/potechin-bp-simulator)  
Live simulator: [therisnow.github.io/potechin-bp-simulator](https://therisnow.github.io/potechin-bp-simulator/)  
Contact: [daiy0928@cs.msu.ru](mailto:daiy0928@cs.msu.ru)

## Related papers

- Vincent Girard, Michal Koucký, and Pierre McKenzie, [*Nonuniform Catalytic Space and the Direct Sum for Space*](https://eccc.weizmann.ac.il/report/2015/138/) (2015).
- James Cook and Ian Mertz, [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8) (2022).

## Local use

Run `Start-PotechinSimulator.ps1`, then open `http://localhost:3000/`. The page is local-only; no data is uploaded.

For a no-install copy, unzip `PotechinSimulator-Portable.zip` and double-click `index.html`. This version does not use PowerShell, Node, pnpm, or a local server.
The HTML itself is self-contained; keep `THIRD_PARTY_LICENSES.txt` with redistributed copies.

## What is shown

- all 8 formal sources and independently selectable inputs;
- every physical vertex and static edge in Part 1, the middle map, and Part 2;
- all temporary accepting and rejecting outputs;
- complete accepting and rejecting reverse copies and recovered indices;
- stepwise colored paths, clickable vertex inspection, and live structural checks.
