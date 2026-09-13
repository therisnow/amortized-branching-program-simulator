# 平摊分支程序交互模拟器

[English](README.md) | [简体中文](README.zh-CN.md)

本仓库包含两个相互独立的科研与教学辅助网页。它们分别保存源码、依赖和本地构建命令。

| 模拟器 | 展示内容 | 在线页面 | 源码与说明 |
| --- | --- | --- | --- |
| Potechin | $n=2$ 情形下，平摊分支程序的共享网络构造 | [打开 Potechin](https://therisnow.github.io/amortized-branching-program-simulator/) | [PotechinSimulator/](PotechinSimulator/) |
| Cook–Mertz | $n=4,k=2$ 情形下，Theorem 11 / Algorithm 3 的分块透明寄存器、输出更新与 Gray code 调度 | [打开 Cook–Mertz](https://therisnow.github.io/amortized-branching-program-simulator/cook-mertz/) | [CookMertzSimulator/](CookMertzSimulator/) |

Potechin 页面保留仓库原有的 GitHub Pages 地址；Cook–Mertz 页面位于 `/cook-mertz/`。两个源码目录不共用依赖清单或运行状态；Pages 工作流分别构建，再把各自的单文件网页部署到上述地址。

本地运行时，请进入相应项目目录，按其中的 README 操作。两个网页均用于辅助理解，不能代替论文中的形式化证明。

## 相关论文

- Aaron Potechin, [*A Note on Amortized Branching Program Complexity*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2017.4)（2017）。
- James Cook 和 Ian Mertz, [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8)（2022）。
