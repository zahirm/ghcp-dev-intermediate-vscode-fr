// Builds the workshop guide (docs/index.html, served by GitHub Pages) from README.md.
// README.md stays the source of truth: edit it, then run `node tools/workshop-site/build.mjs`.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { Marked } = require('./vendor/marked.umd.js');

const repo = join(here, '..', '..');
const md = readFileSync(join(repo, 'README.md'), 'utf8');
const outPath = join(repo, 'docs', 'index.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const stripEmoji = (s) => s.replace(/^(?:\p{Extended_Pictographic}|\d\uFE0F?\u20E3|[\uFE0F\u20E3\s])+/u, '').trim();
const plain = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s*\n\s*/g, ' ').trim();

const ICON = {
  copy: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/></svg>',
  check: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',
  sun: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>',
  moon: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"/></svg>',
  screen: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="8.5" rx="1.5"/><path d="M5.5 14h5M8 11v3"/></svg>',
  arrow: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
};

let ctx = 'other';
const KEY_RE = /^(Ctrl|Cmd|Alt|Shift|Tab|Échap|Esc|Entrée)(\+|$)/;
const FILE_RE = /^(\.?[\w-]+\/)*\.?[\w.-]+\.(cs|json|md|yml|sln|csproj|txt)(:\d+(-\d+)?)?$|^(src|tests|\.github|\.vscode|admin)\//;

const marked = new Marked({ gfm: true, breaks: false });
marked.use({
  renderer: {
    codespan({ text }) {
      const raw = unesc(text);
      if (KEY_RE.test(raw)) {
        return '<span class="keys">' + raw.split(/(?<=.)\+(?=.)/).map((k) => `<kbd>${esc(k.trim())}</kbd>`).join('<span aria-hidden="true">+</span>') + '</span>';
      }
      if (FILE_RE.test(raw)) return `<code class="file">${esc(raw)}</code>`;
      if (ctx === 'demo' && /\s/.test(raw) && raw.length >= 16 && !/[<>=(){};]/.test(raw)) {
        return `<button type="button" class="inline-prompt" data-copy="${esc(raw)}"><span class="sr-only">Copier : </span><code>${esc(raw)}</code>${ICON.copy}</button>`;
      }
      return `<code>${esc(raw)}</code>`;
    },
    code({ text, lang }) {
      const label = lang === 'csharp' ? 'C#' : lang === 'powershell' ? 'Terminal' : lang || 'Terminal';
      return `<figure class="codeblock"><figcaption><span>${esc(label)}</span>${copyButton()}</figcaption><pre><code>${esc(text)}</code></pre></figure>`;
    },
    blockquote(token) {
      const inner = this.parser.parse(token.tokens);
      if (/^\*\*Point de discussion/.test(token.text)) {
        return `<aside class="takeaway"><p class="callout-label">Point de discussion</p>${inner.replace(/^<p><strong>Point de discussion\s*:<\/strong>\s*/, '<p>')}</aside>`;
      }
      if (/^\[!NOTE\]/.test(token.text)) {
        return `<aside class="note"><p class="callout-label">Note</p>${inner.replace(/^<p>\[!NOTE\]\s*/, '<p>')}</aside>`;
      }
      if (ctx === 'demo') {
        return `<figure class="prompt"><figcaption><span>Prompt</span>${copyButton(plain(token.text))}</figcaption><blockquote>${inner}</blockquote></figure>`;
      }
      return `<aside class="note">${inner}</aside>`;
    },
  },
});

function copyButton(text) {
  const data = text === undefined ? '' : ` data-copy="${esc(text)}"`;
  return `<button type="button" class="copy-btn"${data}><span class="copy-idle">${ICON.copy}Copier</span><span class="copy-done" aria-hidden="true">${ICON.check}Copié</span></button>`;
}

function render(tokens, mode = 'other') {
  ctx = mode;
  let html = marked.parser(tokens);
  ctx = 'other';
  html = html
    .replace(/<table>/g, '<div class="table-wrap" role="region" tabindex="0" aria-label="Tableau défilant"><table>')
    .replace(/<\/table>/g, '</table></div>')
    .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
  return html;
}

// ---------- Split README into intro, sections, parts and demos ----------
const tokens = marked.lexer(md);
let title = '';
const intro = [];
const sections = [];
let current = null;
let demo = null;
for (const t of tokens) {
  if (t.type === 'hr' || t.type === 'space') continue;
  if (t.type === 'heading' && t.depth === 1) { title = t.text; continue; }
  if (t.type === 'heading' && t.depth === 2) {
    current = { heading: stripEmoji(t.text), tokens: [], demos: [] };
    sections.push(current);
    demo = null;
    continue;
  }
  if (t.type === 'heading' && t.depth === 3 && current) {
    const m = stripEmoji(t.text).match(/^Démo (\d+)\s*—\s*(.+?)\s*\((\d+)\s*min\)$/);
    if (!m) throw new Error(`Unrecognized demo heading: ${t.text}`);
    demo = { n: Number(m[1]), title: m[2], minutes: Number(m[3]), tokens: [] };
    current.demos.push(demo);
    continue;
  }
  if (!current) intro.push(t);
  else if (demo) demo.tokens.push(t);
  else current.tokens.push(t);
}

const find = (re) => {
  const s = sections.find((x) => re.test(x.heading));
  if (!s) throw new Error(`Missing README section ${re}`);
  return s;
};
const layout = find(/^Disposition/);
const prereq = find(/^Prérequis/);
const build = find(/^Compiler/);
const files = find(/^Fichiers/);
const parts = sections.filter((s) => s.demos.length).map((s) => {
  const m = s.heading.match(/^Partie ([A-Z])\s*—\s*(.+)$/);
  return { letter: m ? m[1] : '', title: m ? m[2] : s.heading, demos: s.demos, tokens: s.tokens };
});
const allDemos = parts.flatMap((p) => p.demos.map((d) => ({ ...d, part: p.letter })));
const total = allDemos.reduce((s, d) => s + d.minutes, 0);
const pad = (n) => String(n).padStart(2, '0');

// Prerequisites become a persisted checklist.
const prereqList = prereq.tokens.find((t) => t.type === 'list');
const prereqHtml = prereqList.items.map((item, i) => {
  ctx = 'other';
  const body = marked.parser(item.tokens).replace(/^<p>|<\/p>\s*$/g, '');
  return `<li><label class="check"><input type="checkbox" data-prep="${i}"><span class="check-box" aria-hidden="true">${ICON.check}</span><span>${body}</span></label></li>`;
}).join('\n');

// ---------- Page fragments ----------
const strip = parts.map((p, pi) => {
  const segs = p.demos.map((d) => {
    const label = `Démo ${d.n} : ${d.title}, ${d.minutes} min`;
    return `<li style="flex-grow:${d.minutes}"><a href="#demo-${d.n}" data-nav-demo="${d.n}" data-label="${esc(label)}" aria-label="${esc(label)}" title="${esc(`${d.n}. ${d.title} · ${d.minutes} min`)}"></a></li>`;
  }).join('');
  return (pi ? '<li class="strip-gap" aria-hidden="true"></li>' : '') + segs;
}).join('');

const rail = parts.map((p) => `
      <p class="rail-part">Partie ${esc(p.letter)}</p>
      <ol>${p.demos.map((d) => `
        <li><a href="#demo-${d.n}" data-nav-demo="${d.n}"><span class="rail-num"><span class="n">${pad(d.n)}</span>${ICON.check}</span><span class="rail-title">${esc(d.title)}</span><span class="rail-min">${d.minutes}′</span></a></li>`).join('')}
      </ol>`).join('');

const demoHtml = parts.map((p) => {
  const partMinutes = p.demos.reduce((s, d) => s + d.minutes, 0);
  return `
      <section class="part" id="partie-${p.letter.toLowerCase()}" aria-labelledby="partie-${p.letter.toLowerCase()}-title">
        <header class="part-head">
          <p class="part-letter" aria-hidden="true">${esc(p.letter)}</p>
          <div>
            <p class="eyebrow">Partie ${esc(p.letter)} · ${p.demos.length} démos · ${partMinutes} min</p>
            <h2 id="partie-${p.letter.toLowerCase()}-title">${esc(p.title)}</h2>
          </div>
        </header>
        ${p.demos.map((d) => {
          const idx = allDemos.findIndex((x) => x.n === d.n);
          const next = allDemos[idx + 1];
          const nextLink = next
            ? `<a class="next" href="#demo-${next.n}"><span>Suivante</span><strong>${pad(next.n)} · ${esc(next.title)}</strong>${ICON.arrow}</a>`
            : `<a class="next" href="#annexe"><span>Fin de l’atelier</span><strong>Annexe · Le kit</strong>${ICON.arrow}</a>`;
          return `
        <article class="demo" id="demo-${d.n}" data-demo="${d.n}" data-minutes="${d.minutes}" aria-labelledby="demo-${d.n}-title">
          <header class="demo-head">
            <span class="demo-num" aria-hidden="true">${pad(d.n)}</span>
            <div class="demo-titles">
              <p class="eyebrow">Démo ${d.n} · ${d.minutes} min</p>
              <h3 id="demo-${d.n}-title" tabindex="-1">${esc(d.title)}</h3>
            </div>
            <button type="button" class="done-btn" data-done="${d.n}" aria-pressed="false"><span class="done-box" aria-hidden="true">${ICON.check}</span>Terminée</button>
          </header>
          <div class="demo-body">
${render(d.tokens, 'demo')}
          </div>
          <footer class="demo-foot">${nextLink}</footer>
        </article>`;
        }).join('')}
      </section>`;
}).join('');

const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Cahier d’atelier GitHub Copilot Dev Intermediate — édition .NET 8.">
<title>Cahier d’atelier · GitHub Copilot Dev Intermediate</title>
<script>
  (() => {
    let theme = null;
    let projection = false;
    try {
      theme = localStorage.getItem('page-theme');
      projection = JSON.parse(localStorage.getItem('gh300-companion') || '{}').projection === true;
    } catch {}
    const root = document.documentElement;
    root.dataset.theme = theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.classList.toggle('projection', projection);
  })();
</script>
<style>
:root {
  color-scheme: light;
  --bg: #f7f6f2;
  --surface: #ffffff;
  --surface-2: #f1f0ea;
  --ink: #1c1d21;
  --muted: #5b5d66;
  --faint: #8a8c94;
  --border: #e3e1d9;
  --border-strong: #cfccc1;
  --accent: #6e40c9;
  --accent-hover: #5a2fb3;
  --accent-soft: #efe9fb;
  --on-accent: #ffffff;
  --ok: #1a7f37;
  --ok-soft: #dcf5e3;
  --note-ink: #6b4300;
  --note-soft: #fdf3dc;
  --shadow: 0 1px 2px rgb(28 29 33 / 5%), 0 6px 20px -12px rgb(28 29 33 / 18%);
  --bar-bg: rgb(247 246 242 / 86%);
  --sans: "Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: "Cascadia Code", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
  --ease-out: cubic-bezier(.23, 1, .32, 1);
  --bar-h: 3.5rem;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #111214;
  --surface: #18191c;
  --surface-2: #202226;
  --ink: #ecebe6;
  --muted: #a7a8ae;
  --faint: #7d7f86;
  --border: #2b2d32;
  --border-strong: #3b3e44;
  --accent: #b392f0;
  --accent-hover: #c8b0f5;
  --accent-soft: #2a2240;
  --on-accent: #111214;
  --ok: #4ac26b;
  --ok-soft: #13301d;
  --note-ink: #f2cc60;
  --note-soft: #2b2309;
  --shadow: 0 1px 2px rgb(0 0 0 / 30%), 0 8px 24px -14px rgb(0 0 0 / 60%);
  --bar-bg: rgb(17 18 20 / 86%);
}

*, *::before, *::after { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; color: var(--ink); background: var(--bg); font: 1rem/1.65 var(--sans); overflow-wrap: anywhere; -webkit-font-smoothing: antialiased; }
a { color: var(--accent); text-underline-offset: .18em; text-decoration-thickness: 1px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
button { font: inherit; color: inherit; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.skip { position: absolute; left: 1rem; top: -4rem; z-index: 60; padding: .5rem .9rem; border-radius: 8px; background: var(--accent); color: var(--on-accent); font-weight: 600; }
.skip:focus { top: .6rem; }
.i { width: 1em; height: 1em; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
code, kbd, pre { font-family: var(--mono); font-variant-ligatures: none; }
code { font-size: .86em; padding: .12em .38em; border-radius: 5px; background: var(--surface-2); border: 1px solid var(--border); }
code.file { color: var(--accent); background: var(--accent-soft); border-color: transparent; }
.keys { white-space: nowrap; color: var(--faint); }
kbd { display: inline-block; min-width: 1.6em; padding: .05em .4em; border: 1px solid var(--border-strong); border-bottom-width: 2px; border-radius: 5px; background: var(--surface); color: var(--ink); font-size: .78em; line-height: 1.5; text-align: center; }
.eyebrow { margin: 0; color: var(--muted); font-size: .74rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }

/* ---------- Top bar with the agenda strip (doubles as progress) ---------- */
.bar { position: sticky; top: 0; z-index: 40; height: var(--bar-h); display: flex; align-items: center; gap: 1.25rem; padding: 0 clamp(.75rem, 3vw, 1.75rem); background: var(--bar-bg); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: .6rem; color: var(--ink); font-weight: 650; font-size: .92rem; text-decoration: none; white-space: nowrap; }
.brand-mark { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 7px; background: var(--ink); color: var(--bg); font: 700 .7rem/1 var(--mono); }
.agenda { flex: 1; min-width: 0; display: flex; align-items: center; gap: .9rem; }
.strip { flex: 1; min-width: 0; display: flex; gap: 3px; margin: 0; padding: 0; list-style: none; }
.strip li { min-width: 6px; }
.strip .strip-gap { flex: 0 0 8px; min-width: 0; }
.strip a { display: block; height: 1.75rem; position: relative; }
.strip a::before { content: ""; position: absolute; inset: auto 0 calc(50% - 3px); height: 6px; border-radius: 3px; background: var(--border-strong); transition: background-color 200ms ease, transform 160ms var(--ease-out); }
.strip a[data-done]::before { background: var(--ok); }
.strip a[aria-current]::before { background: var(--accent); transform: scaleY(1.5); }
.strip a[aria-current][data-done]::before { background: var(--ok); }
.count { flex: none; color: var(--muted); font-size: .8rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.count strong { color: var(--ink); font-weight: 650; }
.tools { flex: none; display: flex; align-items: center; gap: .4rem; }
.tool, .seg button { display: inline-grid; place-items: center; height: 2rem; min-width: 2rem; padding: 0 .5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--muted); cursor: pointer; transition: transform 140ms var(--ease-out), background-color 160ms ease, color 160ms ease; }
.tool { grid-auto-flow: column; gap: .4rem; font-size: .8rem; }
.tool[aria-pressed="true"] { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
.seg { display: inline-flex; padding: 2px; gap: 2px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface-2); }
.seg button { height: 1.75rem; min-width: 1.75rem; padding: 0; border: 0; background: transparent; }
.seg button[aria-pressed="true"] { background: var(--surface); color: var(--ink); box-shadow: 0 1px 2px rgb(0 0 0 / 12%); }
.tool:active, .seg button:active, .copy-btn:active, .done-btn:active, .inline-prompt:active { transform: scale(.97); }
@media (hover: hover) and (pointer: fine) {
  .tool:hover, .seg button:hover { color: var(--ink); }
}

/* ---------- Layout ---------- */
.shell { display: grid; grid-template-columns: 15rem minmax(0, 1fr); gap: clamp(1.5rem, 4vw, 3.5rem); max-width: 76rem; margin: 0 auto; padding: 0 clamp(1rem, 3vw, 2rem); }
.rail { position: sticky; top: var(--bar-h); align-self: start; max-height: calc(100vh - var(--bar-h)); overflow-y: auto; padding: 2rem 0 2rem; scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
.rail > a { display: block; padding: .35rem .5rem; border-radius: 7px; color: var(--muted); font-size: .84rem; text-decoration: none; }
.rail-part { margin: 1.1rem .5rem .3rem; color: var(--faint); font-size: .68rem; font-weight: 650; letter-spacing: .1em; text-transform: uppercase; }
.rail ol { margin: 0; padding: 0; list-style: none; }
.rail ol a { display: grid; grid-template-columns: 1.7rem minmax(0, 1fr) auto; align-items: baseline; gap: .35rem; padding: .32rem .5rem; border-radius: 7px; color: var(--muted); font-size: .84rem; line-height: 1.35; text-decoration: none; }
.rail a[aria-current] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
.rail-num { position: relative; font: 500 .74rem/1 var(--mono); color: var(--faint); }
.rail-num .i { position: absolute; left: 0; top: -.1em; width: 1rem; height: 1rem; color: var(--ok); stroke-width: 2; opacity: 0; transform: scale(.6); transition: opacity 160ms ease, transform 160ms var(--ease-out); }
.rail-num .n { transition: opacity 120ms ease; }
.rail a[data-done] .rail-num .i { opacity: 1; transform: none; }
.rail a[data-done] .rail-num .n { opacity: 0; }
.rail-min { color: var(--faint); font-size: .72rem; font-variant-numeric: tabular-nums; }
.rail-hint { margin: 1.5rem .5rem 0; color: var(--faint); font-size: .74rem; }
@media (hover: hover) and (pointer: fine) {
  .rail a:hover { color: var(--ink); }
}
main { min-width: 0; max-width: 48rem; padding: 2.75rem 0 6rem; }

/* ---------- Intro ---------- */
.intro h1 { margin: .6rem 0 1rem; font-size: clamp(1.9rem, 4.2vw, 2.7rem); line-height: 1.12; letter-spacing: -.025em; font-weight: 680; text-wrap: balance; }
.intro .lede > p:first-child { margin-top: 0; font-size: 1.08rem; color: var(--muted); }
.intro .lede ul { padding-left: 1.1rem; color: var(--muted); font-size: .94rem; }
.intro .lede li { margin: .3rem 0; }
.facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 2rem 0 0; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow: hidden; }
.facts div { padding: .85rem 1rem; border-left: 1px solid var(--border); }
.facts div:first-child { border-left: 0; }
.facts dt { color: var(--faint); font-size: .7rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.facts dd { margin: .15rem 0 0; font-weight: 650; font-variant-numeric: tabular-nums; }

/* ---------- Preparation ---------- */
.prep { margin-top: 3rem; scroll-margin-top: calc(var(--bar-h) + 1rem); }
.prep h2, .annex h2 { margin: .35rem 0 1rem; font-size: 1.35rem; letter-spacing: -.01em; }
.prep-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1rem; }
.panel { padding: 1.1rem 1.2rem; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); box-shadow: var(--shadow); }
.panel h3 { margin: 0 0 .75rem; font-size: .95rem; }
.checklist { margin: 0; padding: 0; list-style: none; display: grid; gap: .6rem; font-size: .88rem; color: var(--muted); }
.check { display: grid; grid-template-columns: 1.15rem minmax(0, 1fr); gap: .6rem; cursor: pointer; }
.check input { position: absolute; opacity: 0; pointer-events: none; }
.check-box { display: grid; place-items: center; width: 1.15rem; height: 1.15rem; margin-top: .2rem; border: 1.5px solid var(--border-strong); border-radius: 5px; background: var(--surface); transition: background-color 150ms ease, border-color 150ms ease; }
.check-box .i { width: .8rem; height: .8rem; stroke-width: 2.4; color: var(--on-accent); opacity: 0; transform: scale(.6); transition: opacity 150ms ease, transform 150ms var(--ease-out); }
.check input:checked + .check-box { background: var(--ok); border-color: var(--ok); }
.check input:checked + .check-box .i { opacity: 1; transform: none; }
.check input:focus-visible + .check-box { outline: 2px solid var(--accent); outline-offset: 2px; }
.panel > p { margin: .8rem 0 0; font-size: .86rem; color: var(--muted); }

/* ---------- Parts and demos ---------- */
.part { margin-top: 4rem; }
.part-head { display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
.part-letter { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; flex: none; margin: 0; border-radius: 10px; background: var(--ink); color: var(--bg); font: 700 1.2rem/1 var(--mono); }
.part-head h2 { margin: .15rem 0 0; font-size: 1.45rem; letter-spacing: -.015em; line-height: 1.25; }
.demo { padding: 2.25rem 0 1.5rem; border-bottom: 1px solid var(--border); scroll-margin-top: var(--bar-h); }
.demo-head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: 1rem; }
.demo-num { width: 3.25rem; font: 300 2.6rem/1 var(--mono); color: var(--border-strong); letter-spacing: -.04em; font-variant-numeric: tabular-nums; transition: color 200ms ease; }
.demo[data-done] .demo-num { color: var(--ok); }
.demo-titles h3 { margin: .2rem 0 0; font-size: 1.3rem; line-height: 1.3; letter-spacing: -.01em; }
.demo-titles h3:focus { outline: none; }
.done-btn { display: inline-flex; align-items: center; gap: .5rem; height: 2.1rem; padding: 0 .8rem 0 .55rem; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--muted); font-size: .82rem; font-weight: 600; cursor: pointer; transition: transform 140ms var(--ease-out), background-color 160ms ease, color 160ms ease, border-color 160ms ease; }
.done-box { display: grid; place-items: center; width: 1.1rem; height: 1.1rem; border: 1.5px solid var(--border-strong); border-radius: 50%; transition: background-color 160ms ease, border-color 160ms ease; }
.done-box .i { width: .72rem; height: .72rem; stroke-width: 2.6; color: var(--on-accent); opacity: 0; transform: scale(.6); transition: opacity 160ms ease, transform 160ms var(--ease-out); }
.done-btn[aria-pressed="true"] { background: var(--ok-soft); border-color: transparent; color: var(--ok); }
.done-btn[aria-pressed="true"] .done-box { background: var(--ok); border-color: var(--ok); }
.done-btn[aria-pressed="true"] .done-box .i { opacity: 1; transform: none; }
@media (hover: hover) and (pointer: fine) {
  .done-btn:hover { border-color: var(--border-strong); color: var(--ink); }
  .done-btn[aria-pressed="true"]:hover { color: var(--ok); }
}

.demo-body { margin: 1.5rem 0 0 4.25rem; font-size: .97rem; }
.demo-body > ul { list-style: none; margin: 0; padding: 0; counter-reset: step; }
.demo-body > ul > li { counter-increment: step; position: relative; padding: 0 0 1.35rem 2.3rem; }
.demo-body > ul > li::before { content: counter(step); position: absolute; left: 0; top: .15rem; display: grid; place-items: center; width: 1.55rem; height: 1.55rem; border: 1px solid var(--border-strong); border-radius: 50%; background: var(--bg); color: var(--muted); font: 600 .72rem/1 var(--mono); }
.demo-body > ul > li:not(:last-child)::after { content: ""; position: absolute; left: calc(.775rem - .5px); top: 1.95rem; bottom: .25rem; width: 1px; background: var(--border); }
.demo-body li > p { margin: 0 0 .6rem; }
.demo-body ul ul { margin: .5rem 0 .2rem; padding-left: 1.1rem; }
.demo-body ul ul li { margin: .35rem 0; }
.demo-body ul ul li::marker { color: var(--faint); }

.prompt, .codeblock { margin: .75rem 0 .9rem; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); overflow: hidden; }
.prompt { border-left: 3px solid var(--accent); }
.prompt figcaption, .codeblock figcaption { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .35rem .4rem .35rem .85rem; border-bottom: 1px solid var(--border); color: var(--faint); font-size: .7rem; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
.prompt blockquote { margin: 0; padding: .8rem .95rem .9rem; font-size: 1rem; line-height: 1.55; }
.prompt blockquote p { margin: 0; }
.codeblock pre { margin: 0; padding: .85rem .95rem; overflow-x: auto; background: var(--surface-2); font-size: .84rem; line-height: 1.6; }
.codeblock pre code { padding: 0; border: 0; background: none; font-size: inherit; }
.copy-btn { position: relative; display: inline-grid; height: 1.75rem; padding: 0 .55rem; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--muted); font-size: .76rem; font-weight: 600; letter-spacing: 0; text-transform: none; cursor: pointer; transition: transform 140ms var(--ease-out), background-color 160ms ease; }
.copy-btn > span { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; gap: .35rem; transition: opacity 150ms ease, filter 150ms ease, transform 150ms var(--ease-out); }
.copy-done { color: var(--ok); opacity: 0; filter: blur(2px); transform: scale(.9); }
.copy-btn[data-copied] .copy-idle { opacity: 0; filter: blur(2px); transform: scale(.9); }
.copy-btn[data-copied] .copy-done { opacity: 1; filter: none; transform: none; }
@media (hover: hover) and (pointer: fine) {
  .copy-btn:hover { background: var(--surface-2); color: var(--ink); }
}
.inline-prompt { display: inline-flex; align-items: center; gap: .35rem; max-width: 100%; margin: 0; padding: .1rem .45rem .1rem .1rem; border: 1px solid var(--border); border-radius: 7px; background: var(--surface); color: var(--muted); text-align: left; cursor: copy; vertical-align: baseline; transition: transform 140ms var(--ease-out), border-color 160ms ease, color 160ms ease; }
.inline-prompt code { border: 0; background: transparent; color: var(--ink); font-family: var(--sans); font-size: .92em; white-space: normal; }
.inline-prompt .i { opacity: .7; }
.inline-prompt[data-copied] { border-color: var(--ok); color: var(--ok); }
@media (hover: hover) and (pointer: fine) {
  .inline-prompt:hover { border-color: var(--accent); color: var(--accent); }
}

.takeaway, .note { margin: .4rem 0 0; padding: .9rem 1.05rem; border-radius: 10px; font-size: .92rem; }
.takeaway { background: var(--accent-soft); }
.note { background: var(--note-soft); }
.takeaway p, .note p { margin: 0; }
.takeaway p + p, .note p + p { margin-top: .5rem; }
.callout-label { margin-bottom: .3rem !important; color: var(--accent); font-size: .7rem; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
.note .callout-label { color: var(--note-ink); }
.demo-foot { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
.next { display: inline-flex; align-items: center; gap: .6rem; padding: .5rem .75rem; border-radius: 9px; color: var(--muted); font-size: .84rem; text-decoration: none; }
.next strong { color: var(--ink); font-weight: 600; }
.next .i { color: var(--accent); }
@media (hover: hover) and (pointer: fine) {
  .next:hover { background: var(--surface); }
}

/* ---------- Annex ---------- */
.annex { margin-top: 4rem; scroll-margin-top: calc(var(--bar-h) + 1rem); }
.annex h3 { margin: 2rem 0 .75rem; font-size: 1rem; }
.table-wrap { position: relative; overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); }
table { width: 100%; border-collapse: collapse; font-size: .86rem; }
th, td { padding: .6rem .8rem; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
th { color: var(--faint); font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; background: var(--surface-2); }
tr:last-child td { border-bottom: 0; }
td:first-child { width: 38%; }
.annex .note { margin-top: 1rem; }

.toast { position: fixed; left: 50%; bottom: 1.25rem; z-index: 50; padding: .5rem .9rem; border-radius: 9px; background: var(--ink); color: var(--bg); font-size: .84rem; box-shadow: var(--shadow); opacity: 0; transform: translate(-50%, .5rem); pointer-events: none; transition: opacity 180ms ease, transform 220ms var(--ease-out); }
.toast[data-show] { opacity: 1; transform: translate(-50%, 0); }

/* ---------- Projection mode: larger type, no rail, for screen sharing ---------- */
html.projection { font-size: 118%; }
html.projection .shell { grid-template-columns: minmax(0, 1fr); max-width: 60rem; }
html.projection .rail { display: none; }
html.projection main { max-width: none; }

/* ---------- Responsive ---------- */
@media (max-width: 960px) {
  .shell { grid-template-columns: minmax(0, 1fr); }
  .rail { display: none; }
  main { max-width: none; }
}
@media (max-width: 680px) {
  .brand-text, .tool-label { display: none; }
  .bar { gap: .75rem; }
  .agenda { gap: .6rem; }
  .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .facts div:nth-child(3) { border-left: 0; }
  .facts div:nth-child(n+3) { border-top: 1px solid var(--border); }
  .prep-grid { grid-template-columns: minmax(0, 1fr); }
  .demo-head { grid-template-columns: minmax(0, 1fr) auto; }
  .demo-num { display: none; }
  .demo-body { margin-left: 0; }
}
@media (max-width: 420px) {
  .count { display: none; }
  .done-btn { padding: 0 .55rem; font-size: 0; gap: 0; }
  .done-btn .done-box { width: 1.2rem; height: 1.2rem; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-property: opacity, background-color, color, border-color !important; }
  .toast { transform: translate(-50%, 0); }
}
@media print {
  :root { color-scheme: light; }
  .bar, .rail, .done-btn, .copy-btn, .demo-foot, .toast, .skip { display: none !important; }
  .shell { display: block; max-width: none; }
  .demo { break-inside: avoid-page; }
}
</style>
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="bar">
  <a class="brand" href="#top" aria-label="Haut de page"><span class="brand-mark" aria-hidden="true">GH</span><span class="brand-text">Cahier d’atelier</span></a>
  <nav class="agenda" aria-label="Agenda de l’atelier">
    <ol class="strip">${strip}</ol>
    <span class="count"><strong data-minutes-done>0</strong> / ${total} min</span>
  </nav>
  <div class="tools">
    <button type="button" class="tool" data-projection aria-pressed="false" title="Mode projection : texte agrandi pour le partage d’écran">${ICON.screen}<span class="tool-label">Projection</span></button>
    <div class="seg" role="group" aria-label="Thème">
      <button type="button" data-set-theme="light" aria-pressed="true" aria-label="Thème clair">${ICON.sun}</button>
      <button type="button" data-set-theme="dark" aria-pressed="false" aria-label="Thème sombre">${ICON.moon}</button>
    </div>
  </div>
</header>

<div class="shell" id="top">
  <nav class="rail" aria-label="Sommaire">
    <a href="#preparation" data-nav-section="preparation">Avant de commencer</a>
    ${rail}
    <p class="rail-part">Annexe</p>
    <a href="#annexe" data-nav-section="annexe">Le kit en détail</a>
    <p class="rail-hint"><kbd>J</kbd> <kbd>K</kbd> démo suivante / précédente</p>
  </nav>

  <main id="contenu">
    <section class="intro" aria-labelledby="titre">
      <p class="eyebrow">Atelier en direct · ${allDemos.length} démos · ${total} min</p>
      <h1 id="titre">${esc(title)}</h1>
      <div class="lede">
${render(intro)}
      </div>
      <dl class="facts">
        <div><dt>Durée</dt><dd>${total} min</dd></div>
        <div><dt>Démos</dt><dd>${allDemos.length}</dd></div>
        <div><dt>Pile</dt><dd>.NET 8 · C#</dd></div>
        <div><dt>Outils</dt><dd>VS Code · Copilot</dd></div>
      </dl>
    </section>

    <section class="prep" id="preparation" aria-labelledby="prep-title">
      <p class="eyebrow">Étape 0 · avant le début</p>
      <h2 id="prep-title">Avant de commencer</h2>
      <div class="prep-grid">
        <div class="panel">
          <h3>Prérequis</h3>
          <ul class="checklist">
${prereqHtml}
          </ul>
        </div>
        <div class="panel">
          <h3>Compiler et exécuter</h3>
${render(build.tokens)}
        </div>
      </div>
    </section>
${demoHtml}

    <section class="annex" id="annexe" aria-labelledby="annexe-title">
      <p class="eyebrow">Annexe</p>
      <h2 id="annexe-title">Le kit en détail</h2>
      <h3>Disposition de la solution</h3>
${render(layout.tokens)}
      <h3>Fichiers de ce kit</h3>
${render(files.tokens)}
    </section>
  </main>
</div>
<div class="toast" role="status" aria-live="polite"></div>

<script>
(() => {
  const KEY = 'gh300-companion';
  const root = document.documentElement;
  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        done: Array.isArray(saved.done) ? saved.done.map(String) : [],
        prep: Array.isArray(saved.prep) ? saved.prep.map(String) : [],
        projection: saved.projection === true,
      };
    } catch {
      return { done: [], prep: [], projection: false };
    }
  };
  const state = read();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: keep in-memory state */ }
  };

  const demos = [...document.querySelectorAll('.demo')];
  const minutes = Object.fromEntries(demos.map((d) => [d.dataset.demo, Number(d.dataset.minutes)]));
  const minutesDone = document.querySelector('[data-minutes-done]');
  const toast = document.querySelector('.toast');
  let toastTimer;

  function announce(message) {
    toast.textContent = message;
    toast.setAttribute('data-show', '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.removeAttribute('data-show'), 1800);
  }

  function renderProgress() {
    const done = new Set(state.done);
    demos.forEach((demo) => {
      const on = done.has(demo.dataset.demo);
      demo.toggleAttribute('data-done', on);
      demo.querySelector('.done-btn').setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('[data-nav-demo]').forEach((link) => {
      const on = done.has(link.dataset.navDemo);
      link.toggleAttribute('data-done', on);
      if (link.dataset.label) link.setAttribute('aria-label', link.dataset.label + (on ? ' (terminée)' : ''));
    });
    minutesDone.textContent = String(state.done.reduce((sum, id) => sum + (minutes[id] || 0), 0));
    document.querySelectorAll('[data-prep]').forEach((box) => { box.checked = state.prep.includes(box.dataset.prep); });
  }

  document.addEventListener('click', (event) => {
    const doneBtn = event.target.closest('.done-btn');
    if (doneBtn) {
      const id = doneBtn.dataset.done;
      state.done = state.done.includes(id) ? state.done.filter((x) => x !== id) : [...state.done, id];
      save();
      renderProgress();
    }
  });

  document.addEventListener('change', (event) => {
    const box = event.target.closest('[data-prep]');
    if (!box) return;
    state.prep = box.checked ? [...new Set([...state.prep, box.dataset.prep])] : state.prep.filter((x) => x !== box.dataset.prep);
    save();
  });

  // Theme and projection
  const themeButtons = document.querySelectorAll('[data-set-theme]');
  const syncTheme = () => themeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setTheme === root.dataset.theme)));
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    root.dataset.theme = button.dataset.setTheme;
    try { localStorage.setItem('page-theme', button.dataset.setTheme); } catch { /* ignore */ }
    syncTheme();
  }));
  syncTheme();

  const projectionBtn = document.querySelector('[data-projection]');
  const syncProjection = () => {
    root.classList.toggle('projection', state.projection);
    projectionBtn.setAttribute('aria-pressed', String(state.projection));
  };
  projectionBtn.addEventListener('click', () => {
    state.projection = !state.projection;
    save();
    syncProjection();
  });
  syncProjection();

  // Copy: prompts, inline prompts and code blocks
  async function copyText(text, source) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return false;
    }
  }
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.copy-btn, .inline-prompt');
    if (!button) return;
    const block = button.closest('.codeblock, .prompt');
    const source = button.classList.contains('inline-prompt') ? button.querySelector('code') : block.querySelector('code, blockquote');
    const text = button.dataset.copy ?? source.textContent.replace(/\\n$/, '');
    const ok = await copyText(text, source);
    if (ok) {
      button.setAttribute('data-copied', '');
      setTimeout(() => button.removeAttribute('data-copied'), 1400);
      announce('Copié dans le presse-papiers');
    } else {
      announce('Copie bloquée : texte sélectionné, utilisez Ctrl+C');
    }
  });

  // Scroll spy: highlights the current demo in the rail and the agenda strip
  const navLinks = [...document.querySelectorAll('[data-nav-demo], [data-nav-section]')];
  const setCurrent = (id) => navLinks.forEach((link) => {
    const target = link.dataset.navDemo ? 'demo-' + link.dataset.navDemo : link.dataset.navSection;
    if (target === id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) setCurrent(entry.target.id); });
  }, { rootMargin: '-30% 0px -65% 0px' });
  [document.getElementById('preparation'), ...demos, document.getElementById('annexe')].forEach((el) => observer.observe(el));

  // J / K jump between demos instantly (keyboard actions are never animated)
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (key !== 'j' && key !== 'k') return;
    const offset = document.querySelector('.bar').offsetHeight + 4;
    const target = key === 'j'
      ? demos.find((d) => d.getBoundingClientRect().top > offset)
      : demos.filter((d) => d.getBoundingClientRect().top < offset - 8).pop();
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    target.querySelector('h3').focus({ preventScroll: true });
    history.replaceState(null, '', '#' + target.id);
  });

  renderProgress();
})();
</script>
</body>
</html>
`;

writeFileSync(outPath, page);
console.log(`Wrote ${outPath} (${allDemos.length} demos, ${total} min)`);
