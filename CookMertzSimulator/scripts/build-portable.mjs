import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(projectRoot, 'portable');
const katexDirectory = resolve(projectRoot, 'node_modules/katex/dist');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const bundle = await build({
  entryPoints: [resolve(projectRoot, 'portable-src/entry.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome100', 'edge100', 'firefox100', 'safari15'],
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  legalComments: 'none',
  write: false,
});

const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script');
const appStyle = await readFile(resolve(projectRoot, 'app/globals.css'), 'utf8');
let katexStyle = await readFile(resolve(katexDirectory, 'katex.min.css'), 'utf8');
const fontPaths = [...new Set([...katexStyle.matchAll(/url\((fonts\/[^)]+)\)/g)].map((match) => match[1]))];

for (const fontPath of fontPaths) {
  const data = await readFile(resolve(katexDirectory, fontPath));
  const extension = extname(fontPath);
  const mime = extension === '.woff2' ? 'font/woff2' : extension === '.woff' ? 'font/woff' : 'font/ttf';
  katexStyle = katexStyle.replaceAll(`url(${fontPath})`, `url(data:${mime};base64,${data.toString('base64')})`);
}

await writeFile(
  resolve(outputDirectory, 'index.html'),
  `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Cook-Mertz Algorithm 3 portable interactive simulator">
    <title>Cook–Mertz Algorithm 3 Simulator</title>
    <style>${katexStyle}\n${appStyle}</style>
  </head>
  <body>
    <div id="root"></div>
    <noscript>此模拟器需要浏览器启用 JavaScript。</noscript>
    <script>${script}</script>
  </body>
</html>
`,
  'utf8',
);

await writeFile(
  resolve(outputDirectory, '使用说明.txt'),
  `Cook–Mertz Algorithm 3 Simulator（便携版）

使用方法：
1. 双击 index.html，用 Edge、Chrome 或 Firefox 打开。
2. index.html 是完整单文件程序，可以单独复制。
3. 不需要安装 Node、npm，也不需要连接网络。
4. 所有数学字体、公式排版和程序代码均已嵌入。
5. 所有计算均在本地浏览器中完成。
`,
  'utf8',
);

const reactLicense = await readFile(resolve(projectRoot, 'node_modules/react/LICENSE'), 'utf8');
const katexLicense = await readFile(resolve(projectRoot, 'node_modules/katex/LICENSE'), 'utf8');
await writeFile(
  resolve(outputDirectory, 'THIRD_PARTY_LICENSES.txt'),
  `React and React DOM\n\n${reactLicense}\n\nKaTeX\n\n${katexLicense}`,
  'utf8',
);

console.log(`Portable build written to ${outputDirectory}`);
