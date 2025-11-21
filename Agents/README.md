# 🤖 Suite de Agentes - Tibia Assets Editor

Esta pasta contém agentes especializados para análise automatizada do código do projeto Tibia Assets Editor (Rust + Tauri + TypeScript).

## 📋 Agentes Disponíveis

### 1. AGENT_ARCHITECTURE_DOC
**Objetivo:** Gerar documentação educacional sobre a arquitetura da aplicação  
**Saída:** `ARCHITECTURE_GUIDE.md`  
**Foco:** Estrutura de diretórios, fluxo de dados IPC, camadas da aplicação, padrões de design

### 2. AGENT_IPC_SYNC
**Objetivo:** Verificar consistência da comunicação IPC entre Rust e TypeScript  
**Saída:** `IPC_SYNC_REPORT.md`  
**Foco:** Comandos Tauri, tipos de dados, serialização, inconsistências

### 3. AGENT_TYPESCRIPT_ERRORS
**Objetivo:** Analisar erros e problemas no código TypeScript  
**Saída:** `TYPESCRIPT_ERRORS_REPORT.md`  
**Foco:** Erros de lógica, promises sem tratamento, memory leaks, type safety

### 4. AGENT_RUST_PANIC_RISKS
**Objetivo:** Identificar riscos de panic/crash no código Rust  
**Saída:** `RUST_PANIC_RISKS_REPORT.md`  
**Foco:** Unwraps perigosos, bounds checking, error handling, deadlocks

### 5. AGENT_DATA_INTEGRITY
**Objetivo:** Verificar integridade dos dados (appearances, sprites, sounds)  
**Saída:** `DATA_INTEGRITY_REPORT.md`  
**Foco:** Referências quebradas, IDs inválidos, estruturas inconsistentes

### 6. AGENT_STATE_CACHE
**Objetivo:** Analisar gerenciamento de estado e cache  
**Saída:** `STATE_CACHE_REPORT.md`  
**Foco:** Estado global, localStorage, cache de sprites, race conditions

### 7. AGENT_PERFORMANCE
**Objetivo:** Identificar gargalos de performance  
**Saída:** `PERFORMANCE_REPORT.md`  
**Foco:** Operações pesadas, renderização, parsing, otimizações

### 8. AGENT_CODE_SMELL
**Objetivo:** Detectar code smells em Rust e TypeScript  
**Saída:** `CODE_SMELLS_REPORT.md`  
**Foco:** Funções grandes, código duplicado, valores mágicos, má abstração

## 🚀 Como Executar

### Executar um agente específico

No chat do Kiro/Claude, digite:

```
Execute o AGENT_ARCHITECTURE_DOC seguindo as instruções em Agents/AGENT_ARCHITECTURE_DOC.md
```

Ou de forma mais direta:

```
Analise a arquitetura do projeto e gere o relatório ARCHITECTURE_GUIDE.md
```

### Executar todos os agentes

```
Execute todos os agentes seguindo a ordem definida em Agents/ORCHESTRATOR.md
```

### Executar agentes específicos em sequência

```
Execute os agentes AGENT_IPC_SYNC, AGENT_TYPESCRIPT_ERRORS e AGENT_RUST_PANIC_RISKS
```

## 📊 Ordem Recomendada de Execução

Conforme definido no `ORCHESTRATOR.md`:

1. **AGENT_ARCHITECTURE_DOC** - Entenda a estrutura primeiro
2. **AGENT_IPC_SYNC** - Verifique a comunicação entre camadas
3. **AGENT_TYPESCRIPT_ERRORS** - Analise o frontend
4. **AGENT_RUST_PANIC_RISKS** - Analise o backend
5. **AGENT_DATA_INTEGRITY** - Verifique os dados
6. **AGENT_STATE_CACHE** - Analise o estado
7. **AGENT_PERFORMANCE** - Identifique gargalos
8. **AGENT_CODE_SMELL** - Detecte problemas de qualidade

## 📁 Estrutura de Saída

Todos os relatórios serão gerados na raiz do projeto:

```
Beats-Assets-Editor/
├── ARCHITECTURE_GUIDE.md
├── IPC_SYNC_REPORT.md
├── TYPESCRIPT_ERRORS_REPORT.md
├── RUST_PANIC_RISKS_REPORT.md
├── DATA_INTEGRITY_REPORT.md
├── STATE_CACHE_REPORT.md
├── PERFORMANCE_REPORT.md
└── CODE_SMELLS_REPORT.md
```

## ⚙️ Configuração

Os agentes analisam automaticamente:

**Backend (Rust):**
- `src-tauri/src/` - Código-fonte
- `src-tauri/protobuf/` - Definições protobuf
- `src-tauri/Cargo.toml` - Dependências

**Frontend (TypeScript):**
- `src/` - Código-fonte
- `tsconfig.json` - Configuração
- `vite.config.ts` - Build config

## 🔄 Atualizando Análises

Para atualizar os relatórios após mudanças no código:

```
Atualize o relatório PERFORMANCE_REPORT.md executando novamente o AGENT_PERFORMANCE
```

Ou para atualizar todos:

```
Execute novamente todos os agentes para atualizar os relatórios
```

## 📝 Notas Importantes

- ✅ Agentes apenas **leem** código e **geram relatórios**
- ✅ Nenhum agente modifica o código-fonte
- ✅ Relatórios são idempotentes (mesma entrada = mesma saída)
- ✅ Agentes podem ser executados em paralelo ou sequencialmente
- ✅ Relatórios incluem sugestões de correção em alto nível

## 🤝 Contribuindo

Para adicionar novos agentes:

1. Crie um arquivo `AGENT_NOME.md` nesta pasta
2. Siga a estrutura dos agentes existentes:
   - Objetivo
   - Entradas
   - Saída
   - O que o agente DEVE faz
er
   - O que o agente NÃO deve fazer
3. Adicione ao `ORCHESTRATOR.md`
4. Atualize este README

## 📚 Recursos

- [ORCHESTRATOR.md](./ORCHESTRATOR.md) - Coordenação dos agentes
- [../README.md](../README.md) - Documentação principal do projeto

---

**Última atualização:** Novembro 2024  
**Versão:** 1.0.0
