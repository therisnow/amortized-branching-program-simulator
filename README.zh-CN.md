# 平摊分支程序模拟器（n = 2）

[English](README.md) | [简体中文](README.zh-CN.md)

这是一个面向初学者的交互式模拟器，用来展示 Aaron Potechin 在论文 [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4)（2017）中提出的构造。

**[打开在线模拟器](https://therisnow.github.io/potechin-bp-simulator/)**

## 它想说明什么问题？

分支程序通过读取输入比特，并沿着对应的边在图中移动来完成计算。分支程序的大小定义为图中的顶点总数。

如果要重复计算同一个布尔函数，最直接的方法是并排放置许多份相互独立的分支程序。Potechin 的构造说明，还有一种更节省顶点的方法：让许多计算副本使用同一张静态网络，同时保证每个副本最终仍然到达属于自己的接受点或拒绝点。当副本数足够大时，平均到每个副本上的顶点数只与输入长度成线性关系。

完整构造非常庞大。这个模拟器固定 **n = 2**，因此可能的输入只有 `00`、`01`、`10` 和 `11`，构造中共有 **8 个正式起点**。这个例子足够小，可以完整画出来，同时又保留了证明中的所有主要部分。

## 第一次使用：五分钟上手

1. 修改四个真值表比特，选择目标函数 `f`。
2. 为每一条彩色起点路径选择一个输入。
3. 点击 **Play**，或者使用控制按钮逐步运行。
4. 选择一条彩色路径，观察它如何通过正向网络。
5. 查看路径进入接受侧还是拒绝侧，再观察反向网络如何把它送回具有相同起点编号的终点。
6. 点击任意顶点，查看这个顶点所表示的状态。

为了直观显示不同输入之间如何共享顶点，模拟器允许不同彩色路径选择不同输入。在正式的重复计算定义中，一次计算时所有起点使用的是同一个公共输入。

## 如何阅读整张图？

可以把整张网络分成四个阶段。

### 1. Part 1：把起点编号编码成布尔函数

每个起点都有一个最终需要恢复的身份编号。程序依次读取 `x1` 和 `x2`，并把该起点路由到一个由布尔函数 `g` 标记的顶点。对于当前输入 `x`，这个函数满足 `g(x) = 1`。

固定同一个输入时，不同起点会到达不同的物理顶点，因此路径不会合并；对于不同输入，路径则可能复用同一个顶点。构造正是通过这种方式实现共享。

### 2. 中间映射：加入目标函数的信息

Part 1 与真正要计算的函数无关。中间映射是唯一依赖目标函数 `f` 的部分。它把 `g` 替换成新的布尔函数 `h`，逐点定义为：

```text
h(y) = 1  当且仅当  g(y) = f(y)。
```

Part 1 已经保证 `g(x) = 1`，因此这个定义立即给出 `h(x) = f(x)`。从 `g` 到 `h` 的映射是可逆的，所以它不会把两个不同起点的身份合并起来。

### 3. Part 2：计算新函数的取值

Part 2 再次读取输入，并求出真值表中的 `h(x)`。由于 `h(x) = f(x)`，当 `f(x) = 1` 时路径到达临时接受点；当 `f(x) = 0` 时路径到达临时拒绝点。

### 4. 反向网络：恢复原来的起点编号

正向网络已经算出了正确的函数值，但它可能改变各个起点编号之间的排列。为此，接受侧和拒绝侧分别包含一份反向的正向路由网络。路径携带已经算出的结果进入对应的反向网络，撤销由输入造成的编号置换，最终到达与原起点具有相同编号的接受点或拒绝点。

整个过程可以概括为：

```text
起点身份 -> 共享的正向路由 -> 计算 f(x) -> 反向路由 -> 原身份 + 正确输出
```

## 图中颜色的含义

- 彩色覆盖线表示当前正在运行的八条起点路径。
- 标记为 `x_i = 0` 和 `x_i = 1` 的静态边，表示查询顶点的两种可能分支。
- 绿色终点表示函数值 `1`，即接受。
- 红色终点表示函数值 `0`，即拒绝。
- 灰色 `aux` 顶点是当前有效计算不会到达的辅助结构终点。

静态边和当前活动路径可以分别显示或隐藏。你在改变函数或输入时，正确性面板会同步检查网络结构和最终输出。

## 运行方式

### 在线运行——最简单

直接打开 [GitHub Pages 在线版](https://therisnow.github.io/potechin-bp-simulator/)。不需要安装任何软件，模拟器也不会上传你的选择。

### 便携离线版

如果仓库的 [Releases 页面](https://github.com/therisnow/potechin-bp-simulator/releases)提供了便携包，下载并解压 `PotechinSimulator-Portable.zip`，然后打开 `index.html` 即可。它不需要 Node.js、PowerShell 或本地服务器。重新分发时，请保留 `THIRD_PARTY_LICENSES.txt`。

### 从源代码运行

安装 [Node.js](https://nodejs.org/) 22.13 或更高版本以及 pnpm，然后运行：

```bash
pnpm install
pnpm dev
```

Windows 用户也可以使用 `Start-PotechinSimulator.ps1` 启动本地开发版本。检查正式构建和便携版时运行：

```bash
pnpm run check
pnpm run build
pnpm run build:portable
```

## 项目范围

本项目是对 `n = 2` 情形的教学性重建，目标是把论文中的路由思想直观地展示出来。它不是形式化证明工具，也不能代替论文中的严格定义和证明。

## 相关论文

- Aaron Potechin, [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4) (2017).
- Vincent Girard, Michal Koucký, and Pierre McKenzie, [*Nonuniform Catalytic Space and the Direct Sum for Space*](https://eccc.weizmann.ac.il/report/2015/138/) (2015).
- James Cook and Ian Mertz, [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8) (2022).

## 联系方式

- 源代码：[therisnow/potechin-bp-simulator](https://github.com/therisnow/potechin-bp-simulator)
- 邮箱：[daiy0928@cs.msu.ru](mailto:daiy0928@cs.msu.ru)
