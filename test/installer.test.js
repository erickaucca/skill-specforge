'use strict';

// Testes do instalador com um `claude` falso no PATH. Rodam com: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'install.js');
const LAUNCHER = path.join(__dirname, '..', 'lib', 'mcp-run.js');
const posix = process.platform !== 'win32';
const hasGit = spawnSync('git', ['--version']).status === 0;

const FAKE_CLAUDE = `#!/usr/bin/env node
const fs = require('fs');
const a = process.argv.slice(2);
const log = process.env.FAKE_LOG;
const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
fs.appendFileSync(log, JSON.stringify(a) + '\\n');
if (a[0] === 'mcp' && a[1] === 'list') {
  for (const c of calls) if (c[0] === 'mcp' && c[1] === 'add') console.log(c[c.indexOf('--transport') + 2] + ': x - ✓ Connected');
}
if (a[0] === 'plugin' && a[1] === 'list' && calls.some((c) => c[1] === 'install')) console.log('specforge');
`;

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-test-'));
  fs.mkdirSync(path.join(dir, 'bin'));
  fs.mkdirSync(path.join(dir, 'home'));
  fs.writeFileSync(path.join(dir, 'bin', 'claude'), FAKE_CLAUDE, { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'bin', 'uvx'), '#!/bin/sh\nexit 0\n', { mode: 0o755 }); // o instalador só checa `uvx --version`
  const env = {
    ...process.env,
    PATH: `${path.join(dir, 'bin')}${path.delimiter}${process.env.PATH}`,
    HOME: path.join(dir, 'home'),
    GIT_CONFIG_GLOBAL: path.join(dir, 'home', '.gitconfig'),
    SPECFORGE_HOME: path.join(dir, 'sf'),
    FAKE_LOG: path.join(dir, 'calls.log'),
  };
  return {
    dir, env,
    calls: () => (fs.existsSync(env.FAKE_LOG) ? fs.readFileSync(env.FAKE_LOG, 'utf8') : ''),
    envFile: () => path.join(env.SPECFORGE_HOME, '.env'),
  };
}

// Responde cada pergunta (regex, em ordem) assim que ela aparece na saída.
function drive(env, args, rules, cwd) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [BIN, ...args], { env, cwd });
    let out = '', pos = 0, i = 0;
    const timer = setTimeout(() => p.kill(), 15000); // pergunta inesperada: falha com a saída em vez de travar
    p.stdout.on('data', (d) => {
      out += d;
      while (i < rules.length) {
        const m = rules[i][0].exec(out.slice(pos));
        if (!m) break;
        pos += m.index + m[0].length;
        p.stdin.write(`${rules[i][1]}\n`);
        i++;
      }
    });
    p.on('close', (code) => { clearTimeout(timer); resolve({ code, out, answered: i, total: rules.length }); });
  });
}

const CHOICE = /Escolha \[\d\]: /;

test('fluxo completo: grava .env (600), registra os MCPs sem segredo e valida', { skip: !posix }, async () => {
  const s = sandbox();
  const r = await drive(s.env, [], [
    [CHOICE, '1'],                       // gestor: Azure DevOps
    [CHOICE, '1'],                       // git: GitHub
    [/SQL Server\?.*: /, 's'],
    [/Confluence\?.*: /, 's'],
    [/organização.*: /, 'minha-org'],
    [/PAT do Azure DevOps.*: /, 'PAT-SECRETO'],
    [/validar o acesso.*: /, ''],        // pula teste do git
    [/Token \(PAT\) do git.*: /, ''],     // usa o credential manager
    [/Servidor.*: /, 'srv,1433'],
    [/Nome do banco: /, 'Seguros'],
    [/Usuário.*: /, 'svc_ro'],
    [/Senha: /, 'senha-secreta'],
    [CHOICE, '1'],                       // escopo: user
  ]);
  assert.strictEqual(r.answered, r.total, r.out);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /Tudo pronto!/);

  const envText = fs.readFileSync(s.envFile(), 'utf8');
  for (const k of ['AZURE_DEVOPS_ORG="minha-org"', 'ADO_MCP_AUTH_TOKEN="PAT-SECRETO"', 'MSSQL_PASSWORD="senha-secreta"']) assert.ok(envText.includes(k), k);
  assert.strictEqual(fs.statSync(s.envFile()).mode & 0o777, 0o600);
  assert.ok(fs.existsSync(path.join(s.env.SPECFORGE_HOME, 'mcp-run.js')));

  const calls = s.calls();
  for (const id of ['azure-devops', 'sql-server', 'confluence']) assert.ok(calls.includes(`"${id}"`), id);
  assert.ok(!calls.includes('PAT-SECRETO') && !calls.includes('senha-secreta'), 'segredo vazou para a config do claude');
});

test('segunda execução reaproveita valores salvos e não reinstala MCPs', { skip: !posix }, async () => {
  const s = sandbox();
  const first = [
    [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/organização.*: /, 'minha-org'], [/PAT do Azure DevOps.*: /, 'PAT-1'], [CHOICE, '1'],
  ];
  assert.strictEqual((await drive(s.env, [], first)).code, 0);
  const addsBefore = (s.calls().match(/"mcp","add"/g) || []).length;

  const r = await drive(s.env, [], [
    [/Atualizar.*: /, 'n'], [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/Reconfigurar.*: /, 'n'],
  ]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /Azure DevOps.*já configurado/);
  assert.strictEqual((s.calls().match(/"mcp","add"/g) || []).length, addsBefore);
  assert.ok(fs.readFileSync(s.envFile(), 'utf8').includes('PAT-1'));
});

test('campo obrigatório vazio é perguntado de novo em vez de pular o MCP', { skip: !posix }, async () => {
  const s = sandbox();
  const r = await drive(s.env, [], [
    [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/organização.*: /, ''], [/organização.*: /, 'minha-org'], [/PAT do Azure DevOps.*: /, ''], [CHOICE, '1'],
  ]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /Campo obrigatório/);
  assert.ok(s.calls().includes('"azure-devops"'));
});

test('tracker sem dado obrigatório: avisa que o specforge não funciona e sai com 1', { skip: !posix }, async () => {
  const s = sandbox();
  const r = await drive(s.env, [], [
    [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/organização.*: /, ''], [/organização.*: /, ''], [/organização.*: /, ''], [/PAT do Azure DevOps.*: /, ''],
  ]);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /Sem gestor de demandas/);
  assert.ok(!s.calls().includes('"azure-devops"'));
});

test('--yes usa variáveis do ambiente para os MCPs que pedem dados', { skip: !posix }, async () => {
  const s = sandbox();
  const r = await drive({ ...s.env, AZURE_DEVOPS_ORG: 'org-ci' }, ['--yes'], []);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(s.calls().includes('"azure-devops"'), r.out);
  assert.ok(fs.readFileSync(s.envFile(), 'utf8').includes('AZURE_DEVOPS_ORG="org-ci"'));
});

test('reconfigurar troca os valores do .env e recria o MCP', { skip: !posix }, async () => {
  const s = sandbox();
  const first = [
    [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/organização.*: /, 'org-velha'], [/PAT do Azure DevOps.*: /, ''], [CHOICE, '1'],
  ];
  assert.strictEqual((await drive(s.env, [], first)).code, 0);
  const r = await drive(s.env, [], [
    [/Atualizar.*: /, 'n'], [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/Reconfigurar.*: /, 's'], [/organização.*\[org-velha\]: /, 'org-nova'], [/PAT do Azure DevOps.*: /, ''], [CHOICE, '1'],
  ]);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(s.calls().includes('["mcp","remove","azure-devops"]'));
  assert.ok(fs.readFileSync(s.envFile(), 'utf8').includes('AZURE_DEVOPS_ORG="org-nova"'));
});

test('--check diagnostica sem alterar nada e aponta problemas do workspace', { skip: !posix }, async () => {
  const s = sandbox();
  await drive(s.env, [], [
    [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/organização.*: /, 'org'], [/PAT do Azure DevOps.*: /, ''], [CHOICE, '1'],
  ]);
  const ws = path.join(s.dir, 'ws');
  fs.mkdirSync(path.join(ws, 'api'), { recursive: true });
  fs.mkdirSync(path.join(ws, '.claude', 'api'), { recursive: true });
  fs.mkdirSync(path.join(ws, '.claude', 'velho'), { recursive: true });
  fs.writeFileSync(path.join(ws, '.claude', 'api', 'CLAUDE.md'), '#');
  fs.writeFileSync(path.join(ws, '.claude', 'velho', 'CLAUDE.md'), '#');
  fs.writeFileSync(path.join(ws, 'CLAUDE.md'), [
    '# CLAUDE.md', '', '## Projetos vinculados (specforge)', '',
    '| Projeto | Pasta | Stack |', '|---|---|---|', '| api | `api/` | Node |', '| web | `web/` | React |',
  ].join('\n'));
  const before = s.calls().split('\n').length;
  const r = await drive(s.env, ['--check'], [], ws);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /Azure DevOps.*conectado/);
  assert.match(r.out, /✘ web/);
  assert.match(r.out, /\.claude\/velho\/.*órfã/);
  assert.match(r.out, /specforge-add-user/);
  assert.ok(!/"mcp","(add|remove)"/.test(s.calls().split('\n').slice(before - 1).join('\n')));
});

test('git acessível: confirma o acesso e sai com 0', { skip: !posix || !hasGit }, async () => {
  const s = sandbox();
  const repo = path.join(s.dir, 'repo.git');
  spawnSync('git', ['init', '-q', '--bare', repo]);
  const r = await drive(s.env, [], [
    [CHOICE, '4'], [CHOICE, '1'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/validar o acesso.*: /, repo], [/Token \(PAT\) do git.*: /, ''],
  ]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /Repositórios \(GitHub\).*acesso confirmado/);
});

test('git sem acesso: guarda a credencial no helper do git e sai com 1', { skip: !posix || !hasGit }, async () => {
  const s = sandbox();
  spawnSync('git', ['config', '--global', 'credential.helper', 'store'], { env: s.env });
  const r = await drive(s.env, [], [
    [CHOICE, '4'], [CHOICE, '1'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/validar o acesso.*: /, 'https://127.0.0.1:9/org/x.git'], [/Token \(PAT\) do git.*: /, 'ghp_TOKEN'], [/Usuário.*: /, 'meuuser'],
  ]);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /sem acesso/);
  const cred = fs.readFileSync(path.join(s.env.HOME, '.git-credentials'), 'utf8');
  assert.ok(cred.includes('meuuser') && cred.includes('ghp_TOKEN'));
  assert.ok(!s.calls().includes('ghp_TOKEN'));
});

test('--dry-run não grava nada nem chama o claude para alterar', { skip: !posix }, async () => {
  const s = sandbox();
  const r = await drive(s.env, ['--dry-run'], [
    [CHOICE, '1'], [CHOICE, '6'], [/SQL Server\?.*: /, 'n'], [/Confluence\?.*: /, 'n'],
    [/organização.*: /, 'org'], [/PAT do Azure DevOps.*: /, ''], [CHOICE, '1'],
  ]);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(!fs.existsSync(s.env.SPECFORGE_HOME));
  assert.strictEqual(s.calls(), '');
});

test('launcher carrega o .env, expande {{VAR}} e respeita aspas', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-launcher-'));
  fs.writeFileSync(path.join(dir, '.env'), 'MSSQL_PASSWORD="se\\"nha"\nAZURE_DEVOPS_ORG=acme\n');
  const r = spawnSync(process.execPath, [LAUNCHER, '--', process.execPath, '-e', 'console.log(process.env.MSSQL_PASSWORD + "|" + process.argv[1])', '{{AZURE_DEVOPS_ORG}}'], {
    env: { ...process.env, SPECFORGE_HOME: dir }, encoding: 'utf8',
  });
  assert.strictEqual(r.stdout.trim(), 'se"nha|acme');
});
