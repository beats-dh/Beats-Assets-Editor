# AGENT – Rust Panic & Error Risk Analyzer

## Objetivo
Identificar, no código Rust, **pontos de risco de panic/crash** relacionados a:
- Unwraps perigosos
- Acesso inválido a arrays/vetores
- Erros não tratados adequadamente
- Lógica inconsistente que pode causar panic

O agente deve apenas **ler** os arquivos e **gerar relatório**, nunca alterar código.

## Entradas
- Código-fonte Rust (src-tauri/src/)

## Saída
- Relatório `RUST_PANIC_RISKS_REPORT.md`

## O que o agente DEVE fazer
- Procurar:
  - Uso de `.unwrap()` ou `.expect()` em contextos críticos (comandos Tauri, parsing de dados)
  - Acesso a arrays/vetores com índices sem verificação de bounds
  - Pattern matching sem tratamento de todos os casos (missing arms)
  - Conversões de tipos que podem falhar (`.parse()`, casts)
  - Operações aritméticas que podem causar overflow/underflow
  - Locks que podem causar deadlock (múltiplos Mutex/RwLock)
  - Funções que retornam `Result` mas são chamadas com `.unwrap()`
  - Deserialização de dados externos sem validação adequada
  - Acesso a estado compartilhado sem sincronização apropriada
  - Comandos Tauri que não retornam `Result<T, E>`
- Para cada risco:
  - Localização (arquivo, função, linha aproximada)
  - Por que pode causar panic/crash
  - Impacto (crash da aplicação, perda de dados, estado inconsistente)
  - Sugestão de mitigação (usar `?`, pattern matching, validação, etc.)

## O que o agente NÃO deve fazer
- NÃO alterar o código Rust
- NÃO comentar sobre segurança (outro agente faz isso)
- NÃO sugerir mudanças que não possam ser inferidas do código
