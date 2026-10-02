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

const wanted = [];  // MCPs escolhidos (validados no final)
const plan = {};    // id -> { action: 'install' | 'none' | 'skip', values }
const gitState = { provider: null, host: '', url: '', user: '', token: '', tested: false, ok: false };
let trackerIds = [];
let extraIds = [];
let listCache = null;
const cachedList = () => (listCache === null ? (listCache = mcpList()) : listCache);
const byId = (id) => MCPS.find((m) => m.id === id);

const GIT_PROVIDERS = [
  { label: 'GitHub', host: 'github.com', user: 'x-access-token' },
  { label: 'Azure Repos', host: 'dev.azure.com', user: 'pat' },
  { label: 'GitLab', host: 'gitlab.com', user: 'oauth2' },
  { label: 'Bitbucket', host: 'bitbucket.org', user: '' },
  { label: 'Outro', host: '', user: '' },
];

// --- Etapa 3: o que o usuário vai usar (só escolhas, nenhum valor sensível) ---
async function stageChoices() {
  console.log(dim('Marque o que vai usar. Os dados de acesso são pedidos na etapa seguinte.\n'));

  const t = await choose('Gestor de demandas — onde ficam os cards que viram specs?', ['Azure DevOps', 'Linear', 'Os dois', 'Pular (configuro depois)'], 1);
  trackerIds = [['azure-devops'], ['linear'], ['azure-devops', 'linear'], []][t];

  if (!has('git')) {
    console.log(yellow('\nRepositórios — git não encontrado no PATH; instale o git para clonar repositórios. Pulando.'));
  } else {
    const usesAdo = trackerIds.includes('azure-devops');
    const g = await choose('\nRepositórios — qual é o git de origem?', [...GIT_PROVIDERS.map((x) => x.label), 'Pular (configuro depois)'], usesAdo ? 2 : 1);
    if (g < GIT_PROVIDERS.length) {
      gitState.provider = GIT_PROVIDERS[g].label;
      gitState.host = GIT_PROVIDERS[g].host;
      gitState.user = GIT_PROVIDERS[g].user;
    }
  }

  console.log('');
  extraIds = [];
  if (await confirm('Banco de dados — seus projetos usam SQL Server? (consulta somente leitura ao analisar cards)', false)) extraIds.push('sql-server');
  if (await confirm('Base de conhecimento — quer integrar com o Confluence?', true)) extraIds.push('confluence');

  [...trackerIds, ...extraIds].forEach((id) => wanted.push(byId(id)));

  console.log(bold('\nResumo do que será configurado:'));
  console.log(`  Gestor de demandas:     ${trackerIds.map((id) => byId(id).label).join(' + ') || '—'}`);
  console.log(`  Repositórios:           ${gitState.provider || '—'}`);
  console.log(`  Banco de dados:         ${extraIds.includes('sql-server') ? 'SQL Server' : '—'}`);
  console.log(`  Base de conhecimento:   ${extraIds.includes('confluence') ? 'Confluence' : '—'}`);
}

// --- Etapa 4: valores das variáveis (gravados juntos em ~/.specforge/.env) ----
async function collectMcp(mcp, saved, toSave) {
  if (mcpStatus(mcp, cachedList()) !== 'missing') {
    console.log(green(`✔ ${mcp.label}`) + dim(' — já configurado, nada a informar'));
    plan[mcp.id] = { action: 'none' };
    return;
  }
  if (mcp.requires && !has(mcp.requires)) {
    console.log(yellow(`○ ${mcp.label} — requer "${mcp.requires}" no PATH (https://docs.astral.sh/uv/). Instale e rode o instalador de novo.`));
    plan[mcp.id] = { action: 'skip' };
    return;
  }
  if (!mcp.prompts.length) {
    console.log(green(`✔ ${mcp.label}`) + dim(' — não precisa de variáveis (autenticação via /mcp depois)'));
    plan[mcp.id] = { action: 'install', values: {} };
    return;
  }
  if (YES) {
    console.log(dim(`○ ${mcp.label} — precisa de dados interativos; pulado em modo --yes.`));
    plan[mcp.id] = { action: 'skip' };
    return;
  }
  console.log(bold(`\n${mcp.label}`));
  const values = {};
  const mine = {};
  for (const p of mcp.prompts) {
    const v = await ask(`  ${p.label}`, { secret: p.secret, def: saved[p.env] || '' });
    values[p.key] = v;
    if (v) mine[p.env] = v;
  }
  if (mcp.prompts.some((p) => !p.optional && !values[p.key])) {
    console.log(yellow('  Valor obrigatório vazio — este MCP será pulado.'));
    plan[mcp.id] = { action: 'skip' };
    return;
  }
  Object.assign(toSave, mine);
  plan[mcp.id] = { action: 'install', values };
}

async function collectGit(saved, toSave) {
  if (!gitState.provider) return;
  console.log(bold(`\nRepositórios (${gitState.provider})`));
  if (!gitState.host) gitState.host = await ask('  Host do git (ex.: git.suaempresa.com)');
  gitState.url = await ask('  URL de um repositório para validar o acesso (Enter para pular)');
  if (!gitState.url) { console.log(dim('  Acesso não será testado.')); return; }
  if (/^(git@|ssh:)/.test(gitState.url)) {
    console.log(dim('  URL SSH: o acesso depende da sua chave SSH (ssh-add -l / ssh -T git@host); nada a informar.'));
    return;
  }
  try { gitState.host = new URL(gitState.url).host; } catch {}
  const isAdo = /dev\.azure|visualstudio/.test(gitState.host);
  const token = await ask('  Token (PAT) do git (Enter se já usa credential manager)', { secret: true, def: isAdo ? toSave.ADO_MCP_AUTH_TOKEN || saved.ADO_MCP_AUTH_TOKEN || '' : '' });
  if (token) {
    gitState.user = await ask('  Usuário', { def: gitState.user });
    gitState.token = token;
  }
}

async function stageValues() {
  if (!wanted.length && !gitState.provider) { console.log(dim('Nada a configurar.')); return; }
  console.log(dim('Estes valores ficam em ' + ENV_FILE + ' (permissão 600) e são usados pelos MCPs em qualquer projeto.'));
  const saved = readEnvFile();
  const toSave = {};
  for (const id of trackerIds) await collectMcp(byId(id), saved, toSave);
  await collectGit(saved, toSave);
  for (const id of extraIds) await collectMcp(byId(id), saved, toSave);
  if (Object.keys(toSave).length) { console.log(''); saveCredentials(toSave); }
}

// --- Etapa 5: instalação ------------------------------------------------------
async function ensureScope() {
  if (SCOPE) return;
  const s = await choose(bold('Onde registrar os MCPs?'), ['Para todos os meus projetos (user) — recomendado', 'Só para a pasta atual (project, vai para .mcp.json)'], 1);
  SCOPE = s === 0 ? 'user' : 'project';
}

function addMcp(mcp, values) {
  const spec = mcp.build(values);
  const add = ['mcp', 'add', '-s', SCOPE, '--transport', spec.transport, mcp.id];
  if (spec.transport === 'http') add.push(spec.url);
  else add.push('--', 'node', LAUNCHER, '--', ...spec.command); // segredos ficam só no .env
  const r = claude(add, { mutates: true });
  if (r.status !== 0) {
    console.log(red(`✘ Falha ao adicionar ${mcp.label}:`), (r.stderr || r.stdout || '').trim());
    return;
  }
  simulated.mcps.push(mcp.id);
  console.log(green(`✔ ${mcp.label} adicionado.`));
  if (mcp.note) console.log(dim(`  ${mcp.note}`));
}

async function stageInstall() {
  const todo = wanted.filter((m) => plan[m.id] && plan[m.id].action === 'install');
  if (todo.length) {
    await ensureScope();
    for (const mcp of todo) addMcp(mcp, plan[mcp.id].values);
  } else console.log(dim('Nenhum MCP novo para instalar.'));

  if (gitState.token && gitState.url) {
    if (DRY) console.log(dim(`$ git credential approve  (host=${gitState.host}, usuário=${gitState.user}, token=***)`));
    else {
      const helper = run('git', ['config', '--global', 'credential.helper']).stdout.trim();
      if (!helper) console.log(yellow('Nenhum credential helper configurado no git — o token pode não ser lembrado.\n  Configure um (ex.: git config --global credential.helper manager|osxkeychain|store).'));
      run('git', ['credential', 'approve'], { input: `protocol=https\nhost=${gitState.host}\nusername=${gitState.user}\npassword=${gitState.token}\n\n` });
    }
    console.log(green('✔ Credencial do git guardada no credential helper.'));
  }
}

// --- Etapa 6: validação -------------------------------------------------------
function lsRemote(url) {
  if (DRY) { console.log(dim(`$ git ls-remote --heads ${url}`)); return true; }
  const r = run('git', ['ls-remote', '--heads', url], { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, timeout: 30000 });
  return r.status === 0;
}

function verify() {
  console.log(bold('Checagem final'));
  let problems = 0;
  const plug = pluginInstalled();
  console.log(plug ? green('✔ Plugin specforge instalado') : red('✘ Plugin specforge NÃO encontrado'));
  if (!plug) problems++;
  if (gitState.provider) {
    if (!gitState.url) console.log(dim(`○ Repositórios (${gitState.provider}) — acesso não testado`));
    else if (lsRemote(gitState.url)) console.log(green(`✔ Repositórios (${gitState.provider})`) + dim(' — acesso confirmado'));
    else { console.log(red(`✘ Repositórios (${gitState.provider})`) + dim(' — sem acesso ao repositório de teste (confira URL/token/chave SSH)')); problems++; }
  }
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

  const stages = [
    ['Pré-requisitos', async () => {
      if (!has('claude')) {
        console.log(red('✘ Claude Code não encontrado no PATH.'));
        console.log('  Instale em https://claude.ai/code e rode este instalador novamente.');
        process.exit(1);
      }
      console.log(green('✔ Claude Code encontrado.'));
    }],
    ['Plugin specforge', installPlugin],
  ];
  if (!flag('--skip-mcps')) {
    stages.push(['O que você vai usar', stageChoices], ['Dados de acesso', stageValues], ['Instalação das integrações', stageInstall]);
  }
  let problems = 0;
  stages.push(['Validação', async () => { problems = verify(); }]);

  for (const [i, [title, fn]] of stages.entries()) {
    step(i + 1, stages.length, title);
    await fn();
  }

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
