'use strict';

// Catálogo de MCPs que o specforge usa. Para trocar o pacote/URL de algum, edite só aqui.
// Cada prompt tem `env`: a variável gravada em ~/.specforge/.env (lida pelo launcher lib/mcp-run.js).
// `match` identifica um MCP já configurado (por nome) em `claude mcp list`.
module.exports = [
  {
    id: 'azure-devops',
    group: 'tracker',
    label: 'Azure DevOps',
    why: 'ler/atualizar work items, criar tasks e mover cards (tracker)',
    match: /azure.?devops|\bado\b/i,
    prompts: [
      { key: 'org', env: 'AZURE_DEVOPS_ORG', label: 'Nome da organização do Azure DevOps (dev.azure.com/<org>)' },
      { key: 'pat', env: 'ADO_MCP_AUTH_TOKEN', label: 'PAT do Azure DevOps (Enter para usar login no navegador)', secret: true, optional: true },
    ],
    build: ({ pat }) => ({
      transport: 'stdio',
      // -d limita as ferramentas expostas (menos tokens por sessão) aos domínios que o specforge usa:
      // work items, comentários, tasks filhas, colunas do board e busca de identidade.
      command: ['npx', '-y', '@azure-devops/mcp', '{{AZURE_DEVOPS_ORG}}', '-d', 'core', 'work', 'work-items', ...(pat ? ['-a', 'env'] : [])],
    }),
    note: 'Sem PAT, o login é feito no navegador na primeira vez que o MCP for usado.',
  },
  {
    id: 'linear',
    group: 'tracker',
    label: 'Linear',
    why: 'ler/atualizar issues, criar tasks e mover cards (tracker)',
    match: /linear/i,
    prompts: [],
    build: () => ({ transport: 'http', url: 'https://mcp.linear.app/mcp' }),
    note: 'A autenticação (OAuth) é feita ao rodar /mcp dentro do Claude Code.',
  },
  {
    id: 'sql-server',
    group: 'database',
    label: 'SQL Server',
    why: 'consultar o banco do projeto em tempo de análise (somente leitura)',
    match: /sql.?server|mssql/i,
    prompts: [
      { key: 'server', env: 'MSSQL_SERVER', label: 'Servidor (host ou host,porta)' },
      { key: 'database', env: 'MSSQL_DATABASE', label: 'Nome do banco' },
      { key: 'user', env: 'MSSQL_USER', label: 'Usuário (use um usuário SOMENTE LEITURA)' },
      { key: 'password', env: 'MSSQL_PASSWORD', label: 'Senha', secret: true },
    ],
    build: () => ({
      transport: 'stdio',
      command: ['uvx', '--from', 'microsoft_sql_server_mcp', 'mssql_mcp_server'],
    }),
    requires: 'uvx',
    note: 'O specforge só faz consultas de leitura; configure um usuário com permissão db_datareader.',
  },
  {
    id: 'confluence',
    group: 'docs',
    label: 'Confluence (Atlassian)',
    why: 'consultar a documentação de produto/regras de negócio',
    match: /atlassian|confluence/i,
    prompts: [],
    build: () => ({
      transport: 'http',
      url: 'https://mcp.atlassian.com/v1/mcp',
    }),
    note: 'A autenticação (OAuth) é feita ao rodar /mcp dentro do Claude Code.',
  },
  {
    id: 'notion',
    group: 'docs',
    label: 'Notion',
    why: 'consultar a documentação de produto/regras de negócio',
    match: /notion/i,
    prompts: [],
    build: () => ({ transport: 'http', url: 'https://mcp.notion.com/mcp' }),
    note: 'A autenticação (OAuth) é feita ao rodar /mcp dentro do Claude Code.',
  },
];
