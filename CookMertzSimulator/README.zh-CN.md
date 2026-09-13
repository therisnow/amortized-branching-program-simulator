# Cook–Mertz Algorithm 3 交互模拟器

[English](README.md) | [简体中文](README.zh-CN.md) | [仓库总览](../README.zh-CN.md)

这是一个独立的交互式精读辅助工具，展示 Cook 与 Mertz 的论文 [*Trading Time and Space in Catalytic Branching Programs*](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CCC.2022.8) 中 Theorem 11 背后的分块透明寄存器构造。

**[打开在线模拟器](https://therisnow.github.io/amortized-branching-program-simulator/cook-mertz/)** · [打开 Potechin 模拟器](https://therisnow.github.io/amortized-branching-program-simulator/)

固定例子为 $n=4$、$k=2$、$G_1=\{1,2\}$、$G_2=\{3,4\}$、$f(x)=x_1x_2x_3x_4$。页面使用同一套播放控制，对照展示 Gray code 调度与每轮恢复初值的调度；每一步都显示当前计算及两种调度各自的寄存器内容。空集因子是常数 $1$，因此不建立空集寄存器。

## 从源码运行

安装 Node.js 22.13 或更高版本，然后从仓库根目录运行：

```bash
cd CookMertzSimulator
npm ci
npm run dev
```

## 验证并生成本地单文件网页

```bash
npm run check
npm run verify:simulator
npm run build
npm run build:portable
```

便携版位于 `portable/index.html`，可直接用现代浏览器打开。验证脚本检查全部 65,536 种输入与初值配置下的输出、寄存器恢复、轮数和查询次数。模拟器验证不等于一般定理的形式化证明。
