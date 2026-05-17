# garage-execution-service

Microsserviço responsável pela fila de execução e acompanhamento das Ordens de Serviço em produção na plataforma SOAT. Gerencia o ciclo de vida da execução — desde o enfileiramento até a conclusão — e coordena a reserva e restauração de estoque junto ao Stock Service.

## Responsabilidades

- Enfileirar Ordens de Serviço aprovadas para execução
- Controlar o início e fim da execução por mecânicos
- Registrar eventos de reparo em log auditável (MongoDB)
- Reservar itens de estoque ao iniciar execução e restaurá-los em caso de falha
- Publicar eventos de conclusão para o OS Service finalizar a Saga

## Papel na Saga

O execution-service é um **participante** da Saga orquestrada pelo OS Service. Consome comandos de `execution.commands`, interage com o Stock Service via `stock.commands`/`stock.replies`, e publica respostas em `execution.replies` e eventos em `execution.events`.

```
OS Service                  Execution Service              Stock Service
    |                              |                             |
    |-- ENFILEIRAR_OS -----------> |                             |
    |                              |-- RESERVAR_ESTOQUE -------> |
    |                              |<-- ESTOQUE_RESERVADO ------ |
    |<-- OS_ENFILEIRADA ---------- |                             |
    |                              |                             |
    | (mecânico inicia/finaliza via REST)                        |
    |                              |                             |
    |<-- EXECUCAO_CONCLUIDA ------ |                             |
    |                              |                             |
    | (compensação)                |                             |
    |-- CANCELAR_EXECUCAO -------> |                             |
    |                              |-- RESTAURAR_ESTOQUE ------> |
    |                              |<-- ESTOQUE_RESTAURADO ----- |
    |<-- EXECUCAO_FALHA ---------- |                             |
```

## Stack

- **Runtime**: Node.js 24
- **Linguagem**: TypeScript (ESM)
- **Framework**: Express 5
- **Banco de dados**: MongoDB 7 via Mongoose 9 (NoSQL)
- **Mensageria**: amqplib (RabbitMQ)
- **Testes**: Vitest + @vitest/coverage-v8
- **Observabilidade**: Datadog (dd-trace, logs JSON, métricas StatsD)

## Banco de dados

MongoDB com as seguintes coleções:

| Coleção | Descrição |
|---|---|
| `execution_queues` | Fila de OS aguardando execução, com status e timestamps |
| `service_order_executions` | Registro de execução ativa (início, fim, mecânico responsável) |
| `repair_logs` | Log imutável de eventos de reparo (diagnóstico, peças trocadas, observações) |

A escolha de MongoDB para este serviço é justificada pela natureza dos logs de reparo: documentos flexíveis com campos variáveis (`details`) que se beneficiam do schema-free do NoSQL.

## Endpoints

### Execução
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| `POST` | `/service-orders/:serviceOrderId/start-execution` | ADMIN, MECHANIC | Iniciar execução de uma OS |
| `POST` | `/service-orders/:serviceOrderId/finish-execution` | ADMIN, MECHANIC | Finalizar execução de uma OS |
| `GET` | `/service-orders/:serviceOrderId/execution` | ADMIN, MECHANIC, CLERK | Consultar estado de execução de uma OS |

### Health
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |

## Mensagens RabbitMQ

### Consome — `execution.commands`
| Tipo | Descrição |
|---|---|
| `ENFILEIRAR_OS` | Enfileira a OS e inicia reserva de estoque |
| `CANCELAR_EXECUCAO` | Cancela a execução e restaura estoque (compensação) |

### Consome — `stock.replies`
| Tipo | Descrição |
|---|---|
| `ESTOQUE_RESERVADO` | Confirma reserva; publica `OS_ENFILEIRADA` para o OS Service |
| `ESTOQUE_INSUFICIENTE` | Estoque indisponível; publica `EXECUCAO_FALHA` para compensação |
| `ESTOQUE_RESTAURADO` | Confirma restauração após cancelamento |

### Publica — `execution.replies`
| Tipo | Descrição |
|---|---|
| `OS_ENFILEIRADA` | OS foi enfileirada com sucesso após reserva de estoque |
| `EXECUCAO_FALHA` | Falha ao enfileirar (estoque insuficiente ou erro interno) |

### Publica — `execution.events`
| Tipo | Descrição |
|---|---|
| `STATUS_ATUALIZADO` | Status da execução foi atualizado |
| `EXECUCAO_CONCLUIDA` | Execução finalizada pelo mecânico |

### Publica — `stock.commands`
| Tipo | Descrição |
|---|---|
| `RESERVAR_ESTOQUE` | Solicita reserva dos itens necessários para a OS |
| `RESTAURAR_ESTOQUE` | Solicita restauração dos itens em caso de cancelamento |

## Como rodar

### Pré-requisitos

- Node.js 24
- Docker e Docker Compose
- MongoDB disponível (local ou Atlas)

### Subir dependências

```bash
cp .env.example .env
# Configure MONGO_URL e RABBITMQ_URL

docker compose up -d
```

### Iniciar o serviço

```bash
npm install
npm run dev
```

O serviço sobe na porta `3000` por padrão.

## Testes

```bash
npm test
npm run test:coverage
```

Cobertura mínima configurada: **90%** em linhas, funções e branches.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta HTTP (padrão: `3000`) |
| `MONGO_URL` | String de conexão MongoDB (ex: `mongodb://localhost:27017/garage_execution`) |
| `RABBITMQ_URL` | String de conexão RabbitMQ (amqp/amqps) |
| `DD_TRACE_ENABLED` | Habilita tracing do Datadog |
| `DD_SERVICE` | Nome do serviço no Datadog |

## CI/CD

Três pipelines independentes rodam a cada pull request para `main`:

| Pipeline | Descrição |
|---|---|
| `ci.yml` | Build, lint, testes e relatório de cobertura no PR |
| `lint.yml` | ESLint via reviewdog com anotações no diff |
| `quality.yml` | Detecção de duplicação (jscpd) e análise de code smells (sonarjs, security) |
