import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(projectRoot, "portable");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const bundle = await build({
  entryPoints: [resolve(projectRoot, "portable-src/entry.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["chrome100", "edge100", "firefox100", "safari15"],
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  legalComments: "none",
  write: false,
});

const script = bundle.outputFiles[0].text.replaceAll("</script", "<\\/script");
const style = await readFile(resolve(projectRoot, "app/globals.css"), "utf8");

await writeFile(
  resolve(outputDirectory, "index.html"),
  `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Portable n=2 Potechin branching-program simulator">
    <title>Potechin Branching Program Simulator</title>
    <style>${style}</style>
  </head>
  <body>
    <div id="root"></div>
    <noscript>此模拟器需要浏览器启用 JavaScript。</noscript>
    <script>${script}</script>
  </body>
</html>
`,
  "utf8",
);

await writeFile(
  resolve(outputDirectory, "使用说明.txt"),
  `Potechin Branching Program Simulator（便携版）

使用方法：
1. 双击 index.html，用任意现代浏览器打开。
2. index.html 是完整的单文件程序，单独复制也可以运行。
3. 不需要安装 Node、pnpm，也不需要运行 PowerShell 脚本。
4. 所有计算都在本地浏览器中完成，不会上传数据。
5. 对外分享时请使用完整 ZIP，保留 THIRD_PARTY_LICENSES.txt。

如果系统询问打开方式，请选择 Edge、Chrome、Firefox 或 Safari。
`,
  "utf8",
);

const reactLicense = await readFile(resolve(projectRoot, "node_modules/react/LICENSE"), "utf8");
await writeFile(
  resolve(outputDirectory, "THIRD_PARTY_LICENSES.txt"),
  `React and React DOM\n\n${reactLicense}`,
  "utf8",
);

console.log(`Portable build written to ${outputDirectory}`);
