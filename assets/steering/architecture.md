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

## Requisitos técnicos obrigatórios por tipo de mudança

> Usado pelo agent-developer e agent-qa para desenhar a solução já em conformidade com os
> critérios de qualidade do projeto, e pelo agent-tech-lead para revisar contra o que é
> exigível para cada tipo de mudança — em vez de um checklist genérico que não faz sentido
> para todo tipo de mudança (ex.: healthcheck de API não se aplica a uma stored procedure).
> Inclua só as categorias que existem de fato neste projeto.

### API / endpoint HTTP

| Critério | Requisito obrigatório |
|---|---|
| Escalabilidade | [ex: paginação obrigatória em endpoints de listagem; timeout definido em toda chamada a serviço externo] |
| Observabilidade | [ex: log estruturado de entrada/saída com correlation-id; endpoint /health; métrica de latência e taxa de erro] |
| Cobertura de testes | [ex: ≥ 80%, incluindo teste de contrato do endpoint (schema de request/response)] |
| Segurança | [ex: autenticação via JWT no header Authorization; validação de payload; nenhum dado sensível em log] |

### Job assíncrono / batch / fila

| Critério | Requisito obrigatório |
|---|---|
| Escalabilidade | [ex: processamento idempotente; tamanho de lote configurável] |
| Observabilidade | [ex: log de início/fim de execução com contagem de itens processados/falhos; alerta se a fila não drenar em X minutos] |
| Cobertura de testes | [ex: ≥ 80%, incluindo cenário de retry e de item malformado na fila] |
| Segurança | [ex: mensagens da fila validadas antes de processar; sem exposição de dados sensíveis em log de erro] |

### Procedure ou rotina executada diretamente no banco de dados

| Critério | Requisito obrigatório |
|---|---|
| Escalabilidade | [ex: operação em lote em vez de linha a linha; índice existente para os filtros usados] |
| Observabilidade | [ex: log de auditoria em tabela própria (quem/quando/o quê); não se aplica healthcheck de API] |
| Cobertura de testes | [ex: ≥ 80%, testes de integração contra banco real ou containerizado] |
| Segurança | [ex: nenhuma concatenação de SQL dinâmico com entrada não sanitizada; permissões mínimas necessárias] |

### Biblioteca interna / módulo sem interface externa

| Critério | Requisito obrigatório |
|---|---|
| Escalabilidade | [ex: sem alocação desnecessária em loop quente; complexidade documentada se O(n²) ou pior] |
| Observabilidade | [ex: exceções sempre logadas pelo chamador; não se aplica métrica própria] |
| Cobertura de testes | [ex: ≥ 80%, cobrindo casos de borda da API pública do módulo] |
| Segurança | [ex: não se aplica validação de fronteira — dados já validados pelo chamador] |

<!-- Se o projeto tiver um tipo de mudança que não se encaixa nas categorias acima, adicione uma
nova subseção seguindo o mesmo formato. Se uma categoria acima não existir neste projeto, remova
a subseção correspondente em vez de deixá-la com exemplos genéricos. -->

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
