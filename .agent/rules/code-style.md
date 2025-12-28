---
trigger: always_on
---

# Regras de Comunicação

- Sempre responder em **PT-BR** (Português do Brasil)
- Qualquer conversa deve seguir o padrão PT-BR

---

# Stack do Projeto

Este é um projeto **Tauri** com:
- **Frontend**: TypeScript + Vite + Svelte
- **Backend**: Rust
- **Build System**: Bun (preferir sobre npm/node)

## Documentação de Referência

- **Bun**: https://bun.sh/docs
- **Tauri v2**: https://v2.tauri.app/
- **Svelte**: https://svelte.dev/docs/svelte/overview
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Rust**: https://doc.rust-lang.org/book/

---

# Diretrizes de Código

## Svelte (Frontend)

- Usar Svelte 5 com runes (`$state`, `$derived`, `$effect`)
- Preferir componentes `.svelte` pequenos e reutilizáveis
- Usar `<script lang="ts">` para TypeScript em componentes
- Evitar stores legadas, usar runes para reatividade

## TypeScript

- Usar TypeScript strict mode (já configurado no `tsconfig.json`)
- Preferir `const` sobre `let`, evitar `var`
- Usar async/await ao invés de callbacks/promises encadeadas
- Tipar explicitamente parâmetros de função e retornos
- Organizar imports: Tauri APIs primeiro, depois locais

## Rust (Backend - src-tauri)

- Seguir as configurações do `rustfmt.toml` do projeto
- Max width: 200 caracteres
- Indentação: 4 espaços (sem tabs)
- Trailing comma em coleções multi-linha
- Manter ordenação de imports como escrito
- Documentar funções públicas com doc comments (`///`)

## CSS / Tailwind

- Usar **Tailwind CSS** para novos componentes Svelte
- CSS vanilla existente em `src/styles/` permanece para compatibilidade
- Preferir classes utilitárias do Tailwind sobre CSS customizado
- Usar `@apply` com moderação, apenas para padrões repetitivos

---

# Comandos Comuns

```bash
# Desenvolvimento
bun run dev          # Inicia Vite dev server
bun run tauri dev    # Inicia app Tauri em modo dev

# Build
bun run build        # Build de produção
bun run tauri build  # Build do app Tauri

# Testes
cargo test           # Testes Rust (em src-tauri)
```

---

# Estrutura do Projeto

```
├── src/              # Frontend TypeScript + Svelte
├── src-tauri/        # Backend Rust (Tauri)
│   ├── src/          # Código Rust
│   └── protobuf/     # Definições Protocol Buffers
├── index.html        # Entry point HTML
└── vite.config.ts    # Configuração Vite
```
