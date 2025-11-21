# AGENT – Data Integrity Analyzer (Appearances/Sprites/Sounds)

## Objetivo
Verificar a **integridade dos dados** da aplicação, cruzando:
- Appearances (Objects, Outfits, Effects, Missiles)
- Sprites (catalog-content.json e arquivos de sprite)
- Sounds (sounds.dat e arquivos de áudio)
- Referências entre componentes

O agente deve apenas **ler** os arquivos e **gerar relatório**, nunca alterar código.

## Entradas
- Código Rust de parsing (src-tauri/src/features/)
- Código TypeScript de UI (src/)
- Definições Protocol Buffers (src-tauri/protobuf/)
- Estrutura de dados esperada (types.rs, types.ts)

## Saída
- Relatório `DATA_INTEGRITY_REPORT.md`

## O que o agente DEVE fazer
- Verificar:
  - Referências a sprite IDs inexistentes em appearances
  - Appearances com frame groups vazios ou inválidos
  - Sounds referenciados mas não carregados
  - Inconsistências entre tipos Rust e TypeScript (estruturas IPC)
  - Campos obrigatórios faltando em estruturas de dados
  - IDs duplicados ou conflitantes
  - Subcategorias de Objects sem mapeamento adequado
  - Special meaning IDs sem tratamento no código
  - Texture settings inválidas ou incompletas
- Listar:
  - Cada referência quebrada ou inconsistência
  - Onde ela aparece (arquivo, estrutura)
  - Impacto provável (erro em runtime, crash, dados corrompidos, UI quebrada)
  - Sugestão de correção em alto nível

## O que o agente NÃO deve fazer
- NÃO editar código ou arquivos de dados
- NÃO ajustar valores de propriedades (flags, atributos) – só integridade estrutural
- NÃO tratar segurança (outro agente faz isso)
