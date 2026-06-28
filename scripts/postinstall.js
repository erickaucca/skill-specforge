#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_ROOT = path.resolve(__dirname, '..');

// INIT_CWD é definido pelo npm e aponta para o diretório onde
// o "npm install" foi invocado — ou seja, a raiz do projeto-alvo.
const PROJECT_ROOT = process.env.INIT_CWD || process.cwd();

// Evita copiar para dentro do próprio repositório da skill
if (PROJECT_ROOT === SKILL_ROOT) {
  process.exit(0);
}

const SRC_DIR  = path.join(SKILL_ROOT, 'assets', 'commands');
const DEST_DIR = path.join(PROJECT_ROOT, '.claude', 'commands');

fs.mkdirSync(DEST_DIR, { recursive: true });

const commands = fs.readdirSync(SRC_DIR).filter(f => f.startsWith('specforge-') && f.endsWith('.md'));

if (commands.length === 0) {
  console.error('skill-specforge: nenhum command encontrado em assets/commands/');
  process.exit(1);
}

commands.forEach(file => {
  const dest = path.join(DEST_DIR, file);
  fs.copyFileSync(path.join(SRC_DIR, file), dest);
  console.log(`  ✓ .claude/commands/${file}`);
});

console.log('\nskill-specforge instalada com sucesso.');
console.log('Abra o Claude Code no projeto e rode: /specforge-init-project');
