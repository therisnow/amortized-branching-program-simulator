# 平摊分支程序模拟器（n = 2）

[English](README.md) | [简体中文](README.zh-CN.md)

这是一个面向初学者的交互式模拟器，用来展示 Aaron Potechin 在论文 [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4)（2017）中提出的构造。

**[打开在线模拟器](https://therisnow.github.io/amortized-branching-program-simulator/)**

## 它想说明什么问题？

分支程序通过读取输入比特，并沿着对应的边在图中移动来完成计算。分支程序的大小定义为图中的顶点总数。

重复计算同一个布尔函数时，最直接的方法是复制多份分支程序。Potechin 则让许多起点共享同一张静态网络，同时保留彼此独立的输出。当副本数足够大时，平均到每个副本上的大小只与输入长度成线性关系。

这个模拟器完整展示 **n = 2** 的情形：四种输入（`00`、`01`、`10`、`11`）和八个正式起点。

## 如何使用和阅读

1. 修改四个真值表比特，选择目标函数 `f`。
2. 为每一条彩色起点路径选择一个输入。
3. 点击 **Play**，或者使用控制按钮逐步运行。
4. 观察一条彩色路径依次经过四个阶段：
   - **Part 1** 把起点路由到满足 `g(x) = 1` 的布尔函数 `g`。
   - **中间映射**把 `g` 替换成 `h`，其中 `h(y) = 1` 当且仅当 `g(y) = f(y)`，因此 `h(x) = f(x)`。
   - **Part 2** 计算 `h(x)`，到达临时接受点或拒绝点。
   - **反向网络**保留计算结果，并恢复原来的起点编号。
5. 点击任意顶点，查看它表示的状态。

为了直观显示不同输入之间如何共享顶点，模拟器允许不同彩色路径选择不同输入。在正式的重复计算定义中，一次计算时所有起点使用的是同一个公共输入。

```text
起点身份 -> 共享的正向路由 -> 计算 f(x) -> 反向路由 -> 原身份 + 正确输出
```

## 运行方式

- **在线运行：** 打开 [GitHub Pages 在线版](https://therisnow.github.io/amortized-branching-program-simulator/)。
- **便携版：** 从 [Releases](https://github.com/therisnow/potechin-bp-simulator/releases) 下载并解压 `PotechinSimulator-Portable.zip`，然后打开 `index.html`。
- **从源代码运行：** 安装 [Node.js](https://nodejs.org/) 22.13 或更高版本以及 pnpm，然后运行：

```bash
pnpm install
pnpm dev
```

## 相关论文

- Aaron Potechin, [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4) (2017).
- Vincent Girard, Michal Koucký, and Pierre McKenzie, [*Nonuniform Catalytic Space and the Direct Sum for Space*](https://eccc.weizmann.ac.il/report/2015/138/) (2015).
- James Cook and Ian Mertz, [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8) (2022).
