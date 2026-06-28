#!/usr/bin/env node

'use strict';

const path = require('path');

const COMMANDS = {
  install: 'Copia os commands da skill para .claude/commands/ do diretório atual',
  path:    'Exibe o caminho de instalação da skill (usado por /specforge-init-project)',
};

const cmd = process.argv[2];

if (cmd === 'install') {
  // Reutiliza o mesmo script do postinstall, forçando cwd como PROJECT_ROOT
  process.env.INIT_CWD = process.cwd();
  require('./postinstall.js');

} else if (cmd === 'path') {
  // Retorna o caminho raiz da skill — usado pelo specforge-init-project
  // para localizar assets/commands/ e assets/steering/
  console.log(path.resolve(__dirname, '..'));

} else {
  console.log('Uso: specforge <comando>\n');
  Object.entries(COMMANDS).forEach(([name, desc]) => {
    console.log(`  ${name.padEnd(10)} ${desc}`);
  });
  console.log('');
  process.exitCode = 1;
}
