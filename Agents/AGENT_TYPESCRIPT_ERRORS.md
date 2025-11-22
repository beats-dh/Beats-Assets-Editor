# AGENT – TypeScript Static Analyzer

## Objetivo
Analisar código TypeScript do frontend para encontrar **erros de código e lógica** em:
- Componentes de UI
- Gerenciamento de estado
- Chamadas IPC (Tauri commands)
- Event listeners
- Sistema de cache
- Manipulação de dados

O agente deve apenas **ler** os arquivos e **gerar relatório**, nunca alterar código.

## Entradas
- Todos os arquivos `.ts` do frontend (src/)
- Definições de tipos (types.ts, monsterTypes.ts, soundTypes.ts)
- Configuração TypeScript (tsconfig.json)

## Saída
- Relatório `TYPESCRIPT_ERRORS_REPORT.md`

## O que o agente DEVE fazer
- Detectar:
  - Chamadas a comandos Tauri inexistentes ou com parâmetros incorretos
  - Uso de variáveis potencialmente `null`/`undefined` sem verificação
  - Promises sem tratamento de erro (missing `.catch()` ou `try/catch`)
  - Event listeners adicionados mas nunca removidos (memory leaks)
  - Acesso a elementos DOM que podem não existir
  - Conversões de tipo inseguras (type assertions perigosos)
  - Condições de lógica claramente invertidas ou inúteis
  - Loops pesados em event handlers de alta frequência
  - Cache sem estratégia de invalidação
  - Inconsistências entre tipos TypeScript e estruturas Rust (IPC)
  - Uso de `any` em contextos críticos
  - Funções assíncronas sem `await` apropriado
- Descrever para cada problema:
  - Arquivo, função e linha aproximada
  - Descrição do erro
  - Impacto na aplicação (UI quebrada, memory leak, crash, dados incorretos)
  - Sugestão de ajuste em texto (sem reescrever o código inteiro)

## O que o agente NÃO deve fazer
- NÃO alterar código
- NÃO comentar sobre segurança (outro agente faz isso)
- NÃO reescrever o estilo do código sem motivo funcional
