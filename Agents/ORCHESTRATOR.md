# ORCHESTRATOR – Suite de Agents Tibia Assets Editor (Rust + Tauri + TypeScript)

## Objetivo
Definir como orquestrar a execução de todos os agents desta suite no repositório do Tibia Assets Editor (Rust backend + TypeScript frontend).

O orquestrador **não executa mudanças no código**, apenas coordena a leitura dos arquivos e a geração dos relatórios por cada agent.

## Ordem sugerida de execução

1. **AGENT_ARCHITECTURE_DOC** - Gera documentação da arquitetura
2. **AGENT_IPC_SYNC** - Verifica consistência IPC entre Rust e TypeScript
3. **AGENT_TYPESCRIPT_ERRORS** - Analisa erros no frontend
4. **AGENT_RUST_PANIC_RISKS** - Identifica riscos de panic no backend
5. **AGENT_DATA_INTEGRITY** - Verifica integridade de dados
6. **AGENT_STATE_CACHE** - Analisa estado e cache
7. **AGENT_PERFORMANCE** - Identifica gargalos de performance
8. **AGENT_CODE_SMELL** - Detecta code smells

## Inputs esperados por tipo de arquivo

**Rust (Backend):**
- `src-tauri/src/` - Código-fonte Rust
- `src-tauri/src/features/` - Features organizadas por domínio
- `src-tauri/protobuf/` - Definições Protocol Buffers
- `src-tauri/Cargo.toml` - Dependências
- `src-tauri/tauri.conf.json` - Configuração Tauri

**TypeScript (Frontend):**
- `src/` - Código-fonte TypeScript
- `src/features/` - Features do frontend
- `src/styles/` - CSS modular
- `tsconfig.json` - Configuração TypeScript
- `vite.config.ts` - Configuração Vite

**Configuração:**
- `package.json` - Dependências frontend
- `index.html` - HTML base

## Saídas esperadas ao final da orquestração

- **ARCHITECTURE_GUIDE.md** - Documentação da arquitetura
- **IPC_SYNC_REPORT.md** - Relatório de consistência IPC
- **TYPESCRIPT_ERRORS_REPORT.md** - Erros e problemas no TypeScript
- **RUST_PANIC_RISKS_REPORT.md** - Riscos de panic no Rust
- **DATA_INTEGRITY_REPORT.md** - Problemas de integridade de dados
- **STATE_CACHE_REPORT.md** - Análise de estado e cache
- **PERFORMANCE_REPORT.md** - Gargalos de performance
- **CODE_SMELLS_REPORT.md** - Code smells detectados

Cada agent deve ser chamado com acesso somente-leitura aos arquivos, e deve gravar apenas o relatório de saída correspondente.

## Regras gerais

- Nenhum agent pode alterar arquivos do projeto
- Todos os agents devem ser idempotentes (rodar novamente gera o mesmo relatório para o mesmo estado de código)
- O orquestrador pode rodar todos em paralelo ou em série, desde que respeite paths corretos de entrada/saída
- Agents devem considerar a natureza desktop da aplicação (Tauri) vs web tradicional
- Agents devem entender a comunicação IPC entre Rust e TypeScript
- Agents devem considerar o uso de Protocol Buffers para serialização de dados
