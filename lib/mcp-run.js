#!/usr/bin/env node
'use strict';

// Launcher de MCPs do specforge: carrega ~/.specforge/.env e executa o comando do MCP com
// essas variáveis no ambiente. Uso: node mcp-run.js -- <comando> [args...]
// Placeholders {{VAR}} nos argumentos são trocados pelo valor da variável.
// Assim nenhum segredo fica gravado na configuração do Claude Code.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const home = process.env.SPECFORGE_HOME || path.join(os.homedir(), '.specforge');

function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\(["\\])/g, '$1');
    out[m[1]] = v;
  }
  return out;
}

let fileEnv = {};
try {
  fileEnv = parseEnv(fs.readFileSync(path.join(home, '.env'), 'utf8'));
} catch (e) {
  console.error(`[specforge] não consegui ler ${path.join(home, '.env')}: ${e.message}`);
}

const env = { ...fileEnv, ...process.env }; // variável já definida no shell tem prioridade
const sep = process.argv.indexOf('--');
const [cmd, ...cmdArgs] = process.argv.slice(sep + 1).map((a) => a.replace(/\{\{(\w+)\}\}/g, (_, k) => env[k] || ''));
if (!cmd) {
  console.error('uso: mcp-run.js -- <comando> [args...]');
  process.exit(2);
}

const child = spawn(cmd, cmdArgs, { stdio: 'inherit', env, shell: process.platform === 'win32' });
child.on('exit', (code, sig) => process.exit(sig ? 1 : code));
child.on('error', (e) => { console.error(`[specforge] falha ao executar "${cmd}": ${e.message}`); process.exit(1); });
