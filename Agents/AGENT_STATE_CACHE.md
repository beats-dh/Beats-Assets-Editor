# AGENT – State & Cache Consistency Analyzer

## Objetivo
Analisar o uso de **estado global** e **cache** na aplicação para evitar:
- Estado inconsistente entre frontend e backend
- Cache desatualizado ou corrompido
- Dados persistidos incorretamente
- Race conditions em acesso a estado compartilhado

O agente deve apenas **ler** os arquivos e **gerar relatório**, nunca alterar código.

## Entradas
- Código Rust de gerenciamento de estado (src-tauri/src/state.rs)
- Código TypeScript de cache e estado (src/spriteCache.ts, src/modalState.ts, etc.)
- Uso de localStorage no frontend
- Uso de DashMap e estruturas compartilhadas no backend
- Sistema de settings persistentes

## Saída
- Relatório `STATE_CACHE_REPORT.md`

## O que o agente DEVE fazer
- Mapear todo o estado global usado na aplicação
- Detectar:
  - Estado compartilhado acessado sem sincronização adequada
  - Cache que nunca é invalidado ou limpo
  - Dados salvos no localStorage mas nunca lidos
  - Dados lidos do localStorage mas nunca salvos
  - Inconsistências entre estado do frontend e backend
  - Race conditions em operações de cache (leitura/escrita simultânea)
  - Estado que persiste entre sessões mas não deveria
  - Falta de tratamento de erro ao carregar estado persistido
  - Cache de sprites sem limite de tamanho (memory leak potencial)
  - Uso de DashMap sem considerar concorrência
- Para cada problema:
  - Localização (arquivo, função)
  - Descrição do uso do estado/cache
  - Risco provável (dados corrompidos, memory leak, crash, UI inconsistente)
  - Sugestão de correção em alto nível

## O que o agente NÃO deve fazer
- NÃO alterar código
- NÃO renomear variáveis ou reestruturar estado
- NÃO tratar segurança (outro agente faz isso)
