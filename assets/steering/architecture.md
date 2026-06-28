# Arquitetura — [NOME_DO_PROJETO]

## Stack tecnológica

- **Linguagem:** [ex: TypeScript 5.x / Java 17]
- **Framework principal:** [ex: Next.js 14 / Spring Boot 3.x]
- **Gerenciador de pacotes:** [ex: npm / Maven / Gradle]
- **Banco de dados:** [ex: PostgreSQL 15 / MongoDB]
- **Infraestrutura:** [ex: AWS ECS / Vercel / GCP Cloud Run]

## Estrutura de pastas

```
[ESTRUTURA_DE_PASTAS]
```

<!-- Exemplo:
src/
  domain/       regras de negócio puras, sem dependência de framework
  application/  casos de uso e orquestração
  infra/        implementações de repositório, clientes HTTP, configs
  api/          controllers e DTOs
-->

## Padrões arquiteturais

- **Organização:** [ex: Clean Architecture / Feature-based / Layered MVC]
- **Gerenciamento de estado:** [ex: Zustand / Redux / sem estado global]
- **Comunicação entre módulos:** [ex: eventos internos / chamadas diretas / filas]
- **Autenticação:** [ex: JWT via header Authorization / sessão via cookie]

Decisões relevantes que afetam todo o código:
- [DECISAO_ARQUITETURAL_1]
- [DECISAO_ARQUITETURAL_2]

## Integrações externas

| Serviço | Propósito | Como é chamado |
|---|---|---|
| [SERVICO] | [para quê] | [SDK / HTTP direto / fila] |

## Como rodar localmente

```bash
[COMANDO_INSTALL]   # ex: npm install
[COMANDO_DEV]       # ex: npm run dev
```

Pré-requisitos: [ex: Node 20+, Docker para o banco, variáveis em .env.local]

## Como rodar os testes

```bash
[COMANDO_TEST]            # todos os testes
[COMANDO_TEST_UNITARIO]   # ex: npm test -- --testPathPattern=unit
[COMANDO_TEST_INTEGRACAO] # ex: npm test -- --testPathPattern=integration
```
