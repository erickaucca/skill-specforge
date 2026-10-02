#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');
const MCPS = require('../lib/mcps');

const MARKETPLACE_SOURCE = 'erickaucca/skill-specforge';
const MARKETPLACE_NAME = 'erickaucca-skill-specforge';
const PLUGIN = `specforge@${MARKETPLACE_NAME}`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const HOME_DIR = process.env.SPECFORGE_HOME || path.join(os.homedir(), '.specforge');
const ENV_FILE = path.join(HOME_DIR, '.env');
const LAUNCHER = path.join(HOME_DIR, 'mcp-run.js');
const YES = flag('--yes') || flag('-y');
const DRY = flag('--dry-run'); // simula: não altera nada (usado para ver a experiência)
let SCOPE = opt('--scope', '');

const c = (code) => (s) => (process.stdout.isTTY || process.env.FORCE_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = c(1), dim = c(2), green = c(32), yellow = c(33), red = c(31), cyan = c(36);

// --- execução de comandos -------------------------------------------------
const simulated = { plugin: false, mcps: [] };

function run(cmd, cmdArgs, extra = {}) {
  return spawnSync(cmd, cmdArgs, { encoding: 'utf8', shell: process.platform === 'win32', ...extra });
}
const has = (cmd) => DRY || run(cmd, ['--version']).status === 0;
const ok = { status: 0, stdout: '', stderr: '' };

function claude(cmdArgs, { mutates = false, stdio } = {}) {
  if (DRY && mutates) {
    console.log(dim(`  $ claude ${cmdArgs.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ').replace(/(PASSWORD=)\S+/, '$1***')}`));
    return ok;
  }
  if (DRY) return { ...ok, stdout: '' };
  return run('claude', cmdArgs, stdio ? { stdio } : {});
}

// --- entrada do usuário (funciona com TTY e com stdin redirecionado) ------
const queue = [];
let waiting = null;
let closed = false;
const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (l) => (waiting ? waiting(l) : queue.push(l)));
rl.on('close', () => { closed = true; if (waiting) waiting(''); });
let muted = false;

function ask(question, { secret = false, def = '' } = {}) {
  const suffix = def ? dim(` [${secret ? 'valor salvo: ********' : def}]`) : '';
  process.stdout.write(`${question}${suffix}: `);
  return new Promise((resolve) => {
    const done = (l) => {
      waiting = null;
      if (!process.stdin.isTTY) process.stdout.write(secret ? '********\n' : `${l}\n`);
      resolve(l.trim() || def);
    };
    if (queue.length) return done(queue.shift());
    if (closed) return done('');
    waiting = done;
    muted = secret;
  });
}
async function confirm(question, def = true) {
  if (YES) return def;
  const a = (await ask(`${question} ${dim(def ? '(S/n)' : '(s/N)')}`)).toLowerCase();
  return a ? ['s', 'sim', 'y', 'yes'].includes(a) : def;
}
async function choose(question, options, def = 1) {
  console.log(question);
  options.forEach((o, i) => console.log(`  ${bold(i + 1)}) ${o}`));
  if (YES) return def - 1;
  const a = parseInt(await ask('Escolha', { def: String(def) }), 10);
  return a >= 1 && a <= options.length ? a - 1 : def - 1;
}
const step = (n, t, title) => console.log(`\n${cyan(bold(`[${n}/${t}]`))} ${bold(title)}`);

// --- credenciais globais (~/.specforge/.env) ---------------------------------
function readEnvFile() {
  try {
    const out = {};
    for (const raw of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
      const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\(["\\])/g, '$1');
      out[m[1]] = v;
    }
    return out;
  } catch { return {}; }
}
function saveCredentials(values) {
  const keys = Object.keys(values);
  if (DRY) {
    console.log(dim(`  [simulação] gravaria ${ENV_FILE} (permissão 600) com: ${keys.join(', ')}`));
    console.log(dim(`  [simulação] copiaria o launcher para ${LAUNCHER}`));
    return;
  }
  const merged = { ...readEnvFile(), ...values };
  const body = Object.entries(merged)
    .map(([k, v]) => `${k}="${String(v).replace(/(["\\])/g, '\\$1')}"`).join('\n');
  fs.mkdirSync(HOME_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(ENV_FILE, `# Credenciais dos MCPs do specforge — não commite este arquivo.\n${body}\n`, { mode: 0o600 });
  try { fs.chmodSync(ENV_FILE, 0o600); } catch {}
  fs.copyFileSync(path.join(__dirname, '..', 'lib', 'mcp-run.js'), LAUNCHER);
  console.log(dim(`  Credenciais salvas em ${ENV_FILE}`));
}

// --- estado atual ---------------------------------------------------------
function mcpList() {
  if (DRY) return simulated.mcps.map((m) => `${m}: (simulado) - ${/azure|sql/.test(m) ? '✓ Connected' : '⚠ Needs authentication'}`).join('\n');
  const r = run('claude', ['mcp', 'list']);
  return r.status === 0 ? r.stdout : '';
}
function mcpStatus(mcp, list) {
  const line = list.split('\n').find((l) => mcp.match.test(l.split(':')[0]));
  if (!line) return 'missing';
  if (/connected|✓/i.test(line) && !/fail|✗/i.test(line)) return 'ok';
  if (/auth/i.test(line)) return 'auth';
  return 'fail';
}
function pluginInstalled() {
  if (DRY) return simulated.plugin;
  const r = run('claude', ['plugin', 'list']);
  return r.status === 0 && /specforge/i.test(r.stdout);
}

// --- etapas ---------------------------------------------------------------
async function installPlugin() {
  if (pluginInstalled()) {
    console.log(green('✔ Plugin specforge já instalado.'));
    if (await confirm('Atualizar para a versão mais recente?')) {
      claude(['plugin', 'marketplace', 'update', MARKETPLACE_NAME], { mutates: true, stdio: 'inherit' });
      claude(['plugin', 'update', PLUGIN], { mutates: true, stdio: 'inherit' });
    }
    return;
  }
  console.log('Instalando o plugin (marketplace + plugin)...');
  claude(['plugin', 'marketplace', 'add', MARKETPLACE_SOURCE], { mutates: true, stdio: 'inherit' });
  const r = claude(['plugin', 'install', PLUGIN], { mutates: true, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Falha ao instalar o plugin (veja a saída acima).');
  simulated.plugin = true;
  console.log(green('✔ Plugin instalado.'));
}

async function addMcp(mcp) {
  const saved = readEnvFile();
  const values = {};
  const toSave = {};
  for (const p of mcp.prompts) {
    const v = await ask(`  ${p.label}`, { secret: p.secret, def: saved[p.env] || '' });
    values[p.key] = v;
    if (v) toSave[p.env] = v;
  }
  if (mcp.prompts.some((p) => !p.optional && !values[p.key])) {
    console.log(yellow('  Valor obrigatório vazio — pulando este MCP.'));
    return false;
  }
  if (Object.keys(toSave).length) saveCredentials(toSave);

  const spec = mcp.build(values);
  const add = ['mcp', 'add', '-s', SCOPE, '--transport', spec.transport, mcp.id];
  if (spec.transport === 'http') add.push(spec.url);
  else add.push('--', 'node', LAUNCHER, '--', ...spec.command); // segredos ficam só no .env
  const r = claude(add, { mutates: true });
  if (r.status !== 0) {
    console.log(red(`  ✘ Falha ao adicionar ${mcp.label}:`), (r.stderr || r.stdout || '').trim());
    return false;
  }
  simulated.mcps.push(mcp.id);
  console.log(green(`  ✔ ${mcp.label} adicionado.`));
  if (mcp.note) console.log(dim(`    ${mcp.note}`));
  return true;
}

async function setupMcps() {
  // Perguntas de contexto: só instala o que o usuário realmente usa.
  const tracker = await choose(bold('\nQual tracker de work items você usa?'), ['Azure DevOps', 'Linear', 'Os dois', 'Nenhum / configuro depois'], 1);
  const wantDb = await confirm('Seus projetos usam SQL Server? (permite consultar o banco, somente leitura, ao analisar cards)', false);
  const wantDocs = await confirm('Quer integrar com o Confluence (documentação de produto)?', true);

  const wanted = MCPS.filter((m) => {
    if (m.group === 'tracker') return (tracker === 0 && m.id === 'azure-devops') || (tracker === 1 && m.id === 'linear') || tracker === 2;
    if (m.group === 'database') return wantDb;
    if (m.group === 'docs') return wantDocs;
    return false;
  });
  if (!wanted.length) return [];

  if (!SCOPE) {
    const s = await choose(bold('\nOnde registrar os MCPs?'), ['Para todos os meus projetos (user) — recomendado', 'Só para a pasta atual (project, vai para .mcp.json)'], 1);
    SCOPE = s === 0 ? 'user' : 'project';
  }

  console.log(bold('\nVerificando o que já existe:'));
  const current = mcpList();
  const installedNow = [];
  for (const mcp of wanted) {
    if (mcpStatus(mcp, current) !== 'missing') {
      console.log(green(`✔ ${mcp.label}`) + dim(' — já configurado'));
      installedNow.push(mcp);
      continue;
    }
    console.log(yellow(`○ ${mcp.label}`) + dim(` — não encontrado (${mcp.why})`));
    if (mcp.requires && !has(mcp.requires)) {
      console.log(yellow(`  Requer "${mcp.requires}" no PATH (https://docs.astral.sh/uv/). Instale e rode o instalador de novo.`));
      continue;
    }
    if (YES && mcp.prompts.length) {
      console.log(dim('  Precisa de dados interativos — pulado em modo --yes.'));
      continue;
    }
    if (await confirm(`  Instalar o MCP de ${mcp.label}?`) && (await addMcp(mcp))) installedNow.push(mcp);
  }
  return wanted;
}

function verify(wanted) {
  console.log(bold('\nChecagem final'));
  let problems = 0;
  const plug = pluginInstalled();
  console.log(plug ? green('✔ Plugin specforge instalado') : red('✘ Plugin specforge NÃO encontrado'));
  if (!plug) problems++;
  if (wanted.length) {
    console.log(dim('  Testando conexão dos MCPs (pode levar alguns segundos)...'));
    const list = mcpList();
    for (const mcp of wanted) {
      const st = mcpStatus(mcp, list);
      if (st === 'ok') console.log(green(`✔ ${mcp.label}`) + dim(' — conectado'));
      else if (st === 'auth') console.log(yellow(`⚠ ${mcp.label}`) + dim(' — precisa autenticar: abra o Claude Code e rode /mcp'));
      else if (st === 'missing') { console.log(red(`✘ ${mcp.label}`) + dim(' — não foi instalado')); problems++; }
      else { console.log(red(`✘ ${mcp.label}`) + dim(' — falha de conexão; rode "claude mcp list" para detalhes')); problems++; }
    }
  }
  return problems;
}

async function main() {
  console.log(bold('\nspecforge — instalador') + (DRY ? yellow('  [simulação: nada será alterado]') : ''));
  console.log(dim('Plugin Claude Code: specs técnicas a partir de work items do Azure DevOps/Linear'));

  const total = flag('--skip-mcps') ? 3 : 4;
  step(1, total, 'Verificando pré-requisitos');
  if (!has('claude')) {
    console.log(red('✘ Claude Code não encontrado no PATH.'));
    console.log('  Instale em https://claude.ai/code e rode este instalador novamente.');
    process.exit(1);
  }
  console.log(green('✔ Claude Code encontrado.'));

  step(2, total, 'Plugin specforge');
  await installPlugin();

  let wanted = [];
  if (!flag('--skip-mcps')) {
    step(3, total, 'Integrações (MCPs)');
    wanted = await setupMcps();
  }

  step(total, total, 'Validação');
  const problems = verify(wanted);

  console.log(problems
    ? `\n${yellow(bold('Instalação concluída com pendências'))} — corrija os itens ✘ acima e rode o instalador de novo.`
    : `\n${green(bold('Tudo pronto!'))}`);
  console.log('\nPróximos passos:');
  console.log('  1. Reinicie o Claude Code (os MCPs novos só aparecem em sessões novas)');
  console.log('  2. Rode /mcp e autentique os itens marcados com ⚠');
  if (fs.existsSync(ENV_FILE) || DRY) console.log(dim(`     (credenciais ficam em ${ENV_FILE}; edite lá para trocar senha/PAT)`));
  console.log(`  3. Numa pasta vazia (seu workspace): ${cyan('/specforge-add-project <url-do-repositorio>')}\n`);
  rl.close();
  process.exit(problems ? 1 : 0);
}

main().catch((e) => { console.error(red(`\n✘ ${e.message}`)); rl.close(); process.exit(1); });
