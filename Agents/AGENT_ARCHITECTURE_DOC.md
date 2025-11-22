# AGENT – Architecture & Learning Documentation

## Objetivo
Criar documentação educacional sobre a **arquitetura do Tibia Assets Editor (Tauri + Rust + TypeScript)**, explicando:
- Como a aplicação funciona internamente
- O que cada pasta/módulo faz
- Fluxo de dados entre frontend e backend
- Como os componentes se comunicam via IPC
- Guia para iniciantes entenderem a estrutura

O agente deve apenas **ler** os arquivos e **gerar documentação**, nunca alterar código.

## Entradas
- Estrutura de diretórios do projeto (Rust backend + TypeScript frontend)
- Código-fonte Rust (src-tauri/src/)
- Código-fonte TypeScript (src/)
- Arquivos de configuração (tauri.conf.json, vite.config.ts, tsconfig.json)
- Definições Protocol Buffers (src-tauri/protobuf/)

## Saída
- Relatório `ARCHITECTURE_GUIDE.md`

## O que o agente DEVE fazer
- Mapear estrutura de diretórios e explicar propósito de cada pasta
- Criar diagrama de fluxo de execução (texto/ASCII art)
- Explicar ciclo de vida de eventos principais:
  - Inicialização da aplicação Tauri
  - Carregamento de appearances via protobuf
  - Comunicação IPC (frontend → backend)
  - Sistema de cache de sprites
  - Fluxo de edição e salvamento de assets
  - Sistema de sons
- Documentar camadas da arquitetura:
  - Frontend Layer (TypeScript/Vite - UI, state management)
  - IPC Layer (Tauri commands - comunicação bidirecional)
  - Backend Layer (Rust - parsing, cache, file I/O)
  - Data Layer (Protocol Buffers, LZMA, file system)
- Explicar padrões de design usados:
  - Feature-based architecture (Rust modules)
  - Command pattern (Tauri IPC)
  - Cache strategies (DashMap, lock-free)
  - State management (frontend + backend)
- Criar glossário de termos técnicos (IPC, protobuf, LZMA, appearances, sprites)
- Fornecer exemplos práticos de fluxo de dados

## O que o agente NÃO deve fazer
- NÃO alterar código
- NÃO criar novos sistemas
- NÃO focar em bugs ou problemas (outros agents fazem isso)
- NÃO entrar em detalhes de implementação específica de features

## Público-alvo
- Desenvolvedores iniciantes em Tauri/Rust
- Pessoas querendo aprender arquitetura de aplicações desktop modernas
- Contribuidores novos no projeto
- Estudantes de engenharia de software interessados em Rust + TypeScript

