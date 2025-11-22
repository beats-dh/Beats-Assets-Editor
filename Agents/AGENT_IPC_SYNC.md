# AGENT – IPC & Type Sync Analyzer

## Objetivo
Verificar a **consistência da comunicação IPC** entre:
- Backend Rust (comandos Tauri)
- Frontend TypeScript (chamadas invoke)

O agente deve apenas **ler** os arquivos e **gerar relatório**, nunca alterar código.

## Entradas
- Comandos Tauri registrados em Rust (src-tauri/src/features/*/commands/)
- Chamadas `invoke()` no TypeScript (src/)
- Definições de tipos em ambos os lados (types.rs, types.ts)
- Estruturas de dados serializadas (serde)

## Saída
- Relatório `IPC_SYNC_REPORT.md`

## O que o agente DEVE fazer
- Mapear todos os comandos Tauri registrados no backend
- Mapear todas as chamadas `invoke()` no frontend
- Verificar:
  - Comandos chamados no frontend mas não registrados no backend
  - Comandos registrados no backend mas nunca usados no frontend
  - Diferenças nos tipos de parâmetros (nome, tipo, obrigatoriedade)
  - Diferenças nos tipos de retorno entre Rust e TypeScript
  - Estruturas de dados inconsistentes (campos faltando, tipos diferentes)
  - Enums que não correspondem entre Rust e TypeScript
  - Serialização/deserialização que pode falhar (campos opcionais, tipos incompatíveis)
- Listar:
  - Cada inconsistência encontrada
  - Localização (arquivo Rust e arquivo TypeScript)
  - Impacto provável (erro em runtime, dados incorretos, crash)
  - Sugestão de correção em alto nível (alinhar tipos, adicionar campos, corrigir nomes)

## O que o agente NÃO deve fazer
- NÃO alterar nenhum arquivo
- NÃO sugerir mudanças de segurança (outro agente faz isso)
- NÃO inventar comandos ou tipos inexistentes
