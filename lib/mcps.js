'use strict';

// Catálogo de MCPs que o specforge usa. Para trocar o pacote/URL de algum, edite só aqui.
// `match` identifica um MCP já configurado (por nome) em `claude mcp list`.
module.exports = [
  {
    id: 'azure-devops',
    label: 'Azure DevOps',
    why: 'ler/atualizar work items, criar tasks e mover cards (tracker)',
    match: /azure.?devops|\bado\b/i,
    prompts: [{ key: 'org', label: 'Nome da organização do Azure DevOps (dev.azure.com/<org>)' }],
    build: ({ org }) => ({
      transport: 'stdio',
      command: ['npx', '-y', '@azure-devops/mcp', org],
      env: {},
    }),
    note: 'O login é feito no navegador na primeira vez que o MCP for usado.',
  },
  {
    id: 'sql-server',
    label: 'SQL Server',
    why: 'consultar o banco do projeto em tempo de análise (somente leitura)',
    match: /sql.?server|mssql/i,
    prompts: [
      { key: 'server', label: 'Servidor (host ou host,porta)' },
      { key: 'database', label: 'Nome do banco' },
      { key: 'user', label: 'Usuário (use um usuário SOMENTE LEITURA)' },
      { key: 'password', label: 'Senha', secret: true },
    ],
    build: ({ server, database, user, password }) => ({
      transport: 'stdio',
      command: ['uvx', '--from', 'microsoft_sql_server_mcp', 'mssql_mcp_server'],
      env: {
        MSSQL_SERVER: server,
        MSSQL_DATABASE: database,
        MSSQL_USER: user,
        MSSQL_PASSWORD: password,
      },
    }),
    requires: 'uvx',
    note: 'O specforge só faz consultas de leitura; configure um usuário com permissão db_datareader.',
  },
  {
    id: 'confluence',
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
];
