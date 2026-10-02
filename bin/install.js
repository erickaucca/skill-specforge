#!/usr/bin/env node
'use strict';

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
const YES = flag('--yes') || flag('-y');
const SCOPE = opt('--scope', 'user');

const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = c(1), dim = c(2), green = c(32), yellow = c(33), red = c(31), cyan = c(36);

function run(cmd, cmdArgs, extra = {}) {
  return spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...extra,
  });
}
const has = (cmd) => run(cmd, ['--version']).status === 0;

let rl;
function ask(question, { secret = false, def = '' } = {}) {
  return new Promise((resolve) => {
    if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const suffix = def ? dim(` [${def}]`) : '';
    if (!secret) return rl.question(`${question}${suffix}: `, (a) => resolve(a.trim() || def));
    const out = rl.output;
    const write = rl._writeToOutput;
    rl.question(`${question}: `, (a) => {
      rl._writeToOutput = write;
      out.write('\n');
      resolve(a.trim());
    });
    rl._writeToOutput = (s) => { if (s.includes(question)) write.call(rl, s); };
  });
}
async function confirm(question, def = true) {
  if (YES) return def;
  const a = (await ask(`${question} ${dim(def ? '(S/n)' : '(s/N)')}`)).toLowerCase();
  return a ? ['s', 'sim', 'y', 'yes'].includes(a) : def;
}

function step(n, total, title) {
  console.log(`\n${cyan(bold(`[${n}/${total}]`))} ${bold(title)}`);
}

function configuredMcps() {
  const r = run('claude', ['mcp', 'list']);
  return r.status === 0 ? r.stdout : '';
}

async function installPlugin() {
  const list = run('claude', ['plugin', 'list']);
  const installed = list.status === 0 && /specforge/i.test(list.stdout);
  if (installed) {
    console.log(green('✔ Plugin specforge já instalado.'));
    if (!(await confirm('Atualizar para a versão mais recente?'))) return;
    run('claude', ['plugin', 'marketplace', 'update', MARKETPLACE_NAME], { stdio: 'inherit' });
    run('claude', ['plugin', 'update', PLUGIN], { stdio: 'inherit' });
    return;
  }
  console.log('Adicionando marketplace e instalando o plugin...');
  run('claude', ['plugin', 'marketplace', 'add', MARKETPLACE_SOURCE], { stdio: 'inherit' });
  const r = run('claude', ['plugin', 'install', PLUGIN], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Falha ao instalar o plugin (veja a saída acima).');
  console.log(green('✔ Plugin instalado.'));
}

async function installMcp(mcp) {
  const values = {};
  for (const p of mcp.prompts) values[p.key] = await ask(`  ${p.label}`, { secret: p.secret });
  if (mcp.prompts.some((p) => !values[p.key])) {
    console.log(yellow('  Valor vazio — pulando este MCP.'));
    return false;
  }
  const spec = mcp.build(values);
  const add = ['mcp', 'add', '-s', SCOPE, '--transport', spec.transport];
  for (const [k, v] of Object.entries(spec.env || {})) add.push('-e', `${k}=${v}`);
  add.push(mcp.id);
  if (spec.transport === 'http') add.push(spec.url);
  else add.push('--', ...spec.command);
  const r = run('claude', add);
  if (r.status !== 0) {
    console.log(red(`  ✘ Falha ao adicionar ${mcp.label}:`), (r.stderr || r.stdout || '').trim());
    return false;
  }
  console.log(green(`  ✔ ${mcp.label} adicionado (escopo: ${SCOPE}).`));
  if (mcp.note) console.log(dim(`    ${mcp.note}`));
  return true;
}

async function main() {
  console.log(bold('\nspecforge — instalador'));
  console.log(dim('Plugin Claude Code: specs técnicas a partir de work items do Azure DevOps/Linear\n'));

  const total = flag('--skip-mcps') ? 2 : 3;

  step(1, total, 'Verificando pré-requisitos');
  if (!has('claude')) {
    console.log(red('✘ Claude Code não encontrado no PATH.'));
    console.log('  Instale em https://claude.ai/code e rode este instalador novamente.');
    process.exit(1);
  }
  console.log(green('✔ Claude Code encontrado.'));

  step(2, total, 'Plugin specforge');
  await installPlugin();

  if (!flag('--skip-mcps')) {
    step(3, total, 'MCPs recomendados');
    const current = configuredMcps();
    const todo = [];
    for (const mcp of MCPS) {
      if (mcp.match.test(current)) console.log(green(`✔ ${mcp.label}`) + dim(' — já configurado'));
      else {
        console.log(yellow(`○ ${mcp.label}`) + dim(` — não encontrado (${mcp.why})`));
        todo.push(mcp);
      }
    }
    for (const mcp of todo) {
      console.log(`\n${bold(mcp.label)}`);
      if (mcp.requires && !has(mcp.requires)) {
        console.log(yellow(`  Requer "${mcp.requires}" no PATH (https://docs.astral.sh/uv/). Pulando.`));
        continue;
      }
      if (YES && mcp.prompts.length) {
        console.log(dim('  Precisa de dados interativos — pulado em modo --yes.'));
        continue;
      }
      if (await confirm(`  Instalar o MCP de ${mcp.label}?`)) await installMcp(mcp);
    }
    console.log(dim('\nNão usa Linear? Sem problema. Se usa, adicione com: claude mcp add --transport http linear https://mcp.linear.app/mcp'));
  }

  console.log(`\n${green(bold('Pronto!'))} Reinicie o Claude Code e use, num workspace vazio:`);
  console.log(`  ${cyan('/specforge-add-project <url-do-repositorio>')}\n`);
  if (rl) rl.close();
}

main().catch((e) => {
  console.error(red(`\n✘ ${e.message}`));
  if (rl) rl.close();
  process.exit(1);
});
