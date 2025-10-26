# 🎮 Tibia Assets Editor

Um editor moderno de assets do Tibia 15.x construído com **Rust + Tauri 2** no backend e **TypeScript + Vite 6** no frontend. O foco é ler, inspecionar e manipular dados de `appearances.dat` (Objects, Outfits, Effects, Missiles), além de trabalhar com sprites e estatísticas dos assets.

![Status](https://img.shields.io/badge/status-alpha-yellow)
![Rust](https://img.shields.io/badge/rust-1.90+-orange)
![Tauri](https://img.shields.io/badge/tauri-2-blue)
![Vite](https://img.shields.io/badge/vite-6-purple)
![TypeScript](https://img.shields.io/badge/typescript-5.6-blue)

## ✨ Descrição do Projeto

- Objetivo: oferecer uma interface desktop para explorar e gerenciar assets do Tibia (15.x), incluindo leitura, visualização de estatísticas e operações sobre `appearances.dat` e sprites.
- Principais funcionalidades:
  - Parser de `appearances.dat` via Protocol Buffers (usando `prost`).
  - Suporte completo às categorias: Objects, Outfits, Effects, Missiles.
  - API Tauri com comandos para carregar dados, consultar estatísticas, listar itens, obter detalhes e sprites, atualizar propriedades e salvar alterações.
  - UI moderna e responsiva em HTML/CSS/TS, com busca, paginação e seleção de tamanho de página.
  - Detecção automática do diretório Tibia e de `catalog-content.json` (no projeto ou nos assets do cliente).

## 📋 Requisitos do Sistema

- **Windows 10/11** (Linux/macOS em breve).
- **Node.js 18+** e **npm**.
- **Rust 1.90+** com toolchain MSVC.
- Pré-requisitos Tauri no Windows:
  - **Microsoft Visual C++ Build Tools** (Desktop development with C++).
  - **Microsoft Edge WebView2 Runtime** instalado.
- Dependências principais:
  - Frontend: `vite@^6`, `typescript@~5.6.2`, `@tauri-apps/cli@^2` (dev), `@tauri-apps/api@^2`, `@tauri-apps/plugin-opener@^2`.
  - Backend (Rust): `tauri = "2"`, `tauri-plugin-opener = "2"`, `prost = "0.13"`, `prost-types = "0.13"`, `lzma-rs = "0.3"`, `xz2 = "0.1"`, `image = "0.25"` (png/jpeg/bmp), `serde = "1"`, `serde_json = "1"`, `anyhow = "1"`, `thiserror = "1"`, `log = "0.4"`, `env_logger = "0.11"`, `base64 = "0.22"`.

## 🚀 Instalação e Configuração

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/tibia-assets-editor.git
   cd tibia-assets-editor
   ```
2. Instale dependências do frontend:
   ```bash
   npm install
   ```
3. Verifique pré-requisitos do Tauri (Build Tools e WebView2).
4. (Opcional) Configure variáveis de ambiente para dev remoto:
   - `TAURI_DEV_HOST` — host para HMR remoto (ver `vite.config.ts`).

Configurações relevantes:
- `src-tauri/tauri.conf.json` define `devUrl = http://localhost:1420` e `frontendDist = ../dist`.
- O servidor de desenvolvimento do Vite usa `port: 1420` e HMR em `1421` (quando `TAURI_DEV_HOST` está definido).

## 📖 Guia de Uso

- Desenvolvimento (janela Tauri + Vite):
  ```bash
  npm run tauri dev
  ```
- Build para produção (instalador/executável):
  ```bash
  npm run tauri build
  ```
- Somente frontend (Vite):
  ```bash
  npm run dev      # inicia Vite
  npm run preview  # pré-visualiza build do Vite
  ```

Fluxo no aplicativo:
- Selecione o diretório do cliente Tibia (há detecção automática via `select_tibia_directory`).
- Carregue os appearances e navegue pelas categorias (Objects, Outfits, Effects, Missiles).
- Use busca, paginação e ajuste o tamanho da página para explorar os resultados.
- Consulte detalhes de um appearance e (quando aplicável) visualize sprites.

Sprites/catalog:
- A aplicação procura `catalog-content.json` no diretório do projeto; se não existir, tenta nos assets do cliente Tibia (`<Tibia>/assets/catalog-content.json`).

## 🏗️ Estrutura de Arquivos e Diretórios

```
tibia-assets-editor/
├── src/                   # Frontend (TypeScript/HTML/CSS)
│   ├── main.ts            # Lógica e UI; integra-se com comandos Tauri
│   ├── styles.css         # Tema moderno, responsivo
│   └── assets/            # Recursos estáticos
├── index.html             # Estrutura base da UI
├── src-tauri/             # Backend (Rust/Tauri)
│   ├── src/
│   │   ├── core/          # Parsers, protobuf, sprites, LZMA
│   │   ├── commands/      # API Tauri (IPC) - appearances/sprites/update
│   │   └── lib.rs         # Builder Tauri, estado global, plugins
│   ├── tauri.conf.json    # Configuração Tauri
│   ├── capabilities/      # Capacidades e permissões
│   ├── icons/             # Ícones do app
│   └── Cargo.toml         # Dependências Rust
├── Assets Editor/         # Projeto legado (.NET/WPF); não é parte do app Tauri
├── package.json           # Scripts NPM (dev/build/preview/tauri)
├── tsconfig.json          # TypeScript estrito
└── vite.config.ts         # Config do Vite para Tauri (porta 1420/HMR)
```

## 🧪 Desenvolvimento

- Testes Rust:
  ```bash
  cd src-tauri
  cargo test
  # teste específico
  cargo test test_load_tibia_appearances -- --ignored --nocapture
  ```
- Scripts NPM:
  - `dev`: inicia Vite.
  - `build`: `tsc && vite build`.
  - `preview`: `vite preview`.
  - `tauri`: CLI do Tauri.

## 📦 Instalação e Pré-requisitos

- Windows: `MSVC (Desktop C++)` e `WebView2 Runtime`.
- Node.js `18+`, Rust `stable`.
- Instalação:
  - `npm install`
  - Dev: `npm run tauri dev`
  - Build: `npm run tauri build`

## 🚀 Fluxo de Uso

- Selecione/defina o caminho do cliente Tibia (UI salva via `set_tibia_base_path`).
- Liste arquivos disponíveis: `list_appearance_files({ tibiaPath })`.
- Carregue o arquivo: `load_appearances_file({ path })` (prioriza `appearances_latest.dat`).
- Veja estatísticas: `get_appearance_stats()`.
- Carregue sprites automaticamente: `auto_load_sprites({ tibiaPath })` (busca `catalog-content.json` na raiz do projeto ou em `<Tibia>/assets`).
- Obtenha sprites de um appearance: `get_appearance_sprites({ category, appearanceId })`.
- Obtenha sprite por ID: `get_sprite_by_id({ spriteId })`.
- Salve alterações: `save_appearances_file()`.

## 🔌 Comandos Tauri (IPC)

- IO de Appearances:
  - `list_appearance_files(tibia_path: string) -> string[]` — Lista `appearances-*.dat` e `appearances_latest.dat` em `<Tibia>/assets`.
  - `load_appearances_file(path: string) -> AppearanceStats` — Decodifica protobuf (com fallback LZMA/XZ) e carrega no estado.
  - `get_appearance_stats() -> AppearanceStats` — Totais por categoria + contagens reais.
  - `save_appearances_file() -> number` — Serializa e grava no caminho carregado.
  - `select_tibia_directory() -> string` — Tenta detectar caminhos comuns no Windows.

- Consulta e detalhes:
  - `list_appearances_by_category(category, page, page_size, search?, subcategory?) -> AppearanceItem[]` — Listagem paginada com filtro.
  - `get_appearance_details(category, id) -> AppearanceDetails` — Info de frame groups e contagem de sprites.
  - `get_complete_appearance(category, id) -> CompleteAppearanceItem` — Estrutura completa (flags, frameGroups, spriteInfo).
  - `get_appearance_count(category, search?, subcategory?) -> number` — Contagem para paginação.
  - `get_item_subcategories() -> [key, label][]` — Pares chave/rótulo para filtros de objetos.

- Atualizações de appearances:
  - `update_appearance_name(category, id, new_name) -> AppearanceItem`.
  - `update_appearance_description(category, id, new_description) -> AppearanceItem`.
  - `update_appearance_flag_bool(category, id, flag, value) -> AppearanceItem` — Ativa/desativa flags booleanas.
  - `update_appearance_light(category, id, brightness?, color?) -> AppearanceItem`.
  - `update_appearance_shift(category, id, x?, y?) -> AppearanceItem`.
  - `update_appearance_height(category, id, elevation?) -> AppearanceItem`.
  - `update_appearance_write(category, id, max_text_length?) -> AppearanceItem`.
  - `update_appearance_write_once(category, id, max_text_length_once?) -> AppearanceItem`.

- Sprites:
  - `load_sprites_catalog(catalog_path, assets_dir) -> number` — Inicializa `SpriteLoader`.
  - `auto_load_sprites(tibia_path) -> number` — Usa `catalog-content.json` no projeto ou `<Tibia>/assets`.
  - `get_sprite_by_id(sprite_id) -> base64` — Converte para PNG em base64.
  - `get_appearance_sprites(category, appearance_id) -> base64[]` — Usa cache backend `sprite_cache`.
  - `clear_sprite_cache() -> number` — Limpa cache backend.
  - `get_sprite_cache_stats() -> [entries, sprites]` — Estatísticas do cache backend.

- Settings:
  - `set_tibia_base_path(tibia_path: string) -> void` — Persiste em `settings.json` no diretório de dados do app.
  - `get_tibia_base_path() -> string | null` — Obtém caminho persistido.

## 🧱 Tipos e Categorias

- `AppearanceCategory`: `Objects`, `Outfits`, `Effects`, `Missiles`.
- `ItemSubcategory`: ver `commands/appearances_api/types.rs`; inclui `Armors`, `Amulets`, `Boots`, `Containers`, `Decoration`, `Food`, `HelmetsHats`, `Legs`, `Others`, `Potions`, `Rings`, `Runes`, `Shields`, `Tools`, `Valuables`, `Ammunition`, `Axes`, `Clubs`, `DistanceWeapons`, `Swords`, `WandsRods`, `PremiumScrolls`, `TibiaCoins`, `CreatureProducts`, `Quiver`, `Soulcores`.

## 🤝 Contribuição

- Fork o repositório e crie uma branch descritiva (ex.: `feat/sprites-viewer`, `fix/pagination-wrap`).
- Siga Commits semânticos (Ex.: `feat: adicionar viewer de sprites`, `fix: evitar overlap do header`).
- Garanta que o app executa (`npm run tauri dev`) e que os testes Rust passam.
- Mantenha o estilo da base:
  - TypeScript estrito (`tsconfig.json`).
  - CSS: use variáveis e padrões existentes (borders/buttons unificados).
- Abra um Pull Request com descrição clara, screenshots (se UI) e passos de teste.

## 📜 Licença

- Ainda não há um arquivo de licença definido no repositório. Até ser especificado, considere o uso restrito. Sugestão: adotar **MIT** em `LICENSE` (a ser decidido pelo autor).

## 🧰 Troubleshooting

- Porta `1420` ocupada:
  - Feche processos que usam a porta ou ajuste o ambiente. O Tauri falha se a porta fixa não estiver disponível.
- Erro de build no Windows (linker/MSVC):
  - Instale **Microsoft C++ Build Tools** (Desktop development with C++) e reinicie.
- WebView2 não encontrado:
  - Instale o **Microsoft Edge WebView2 Runtime**.
- `npm install` falha:
  - Use Node 18+, apague `node_modules` e tente novamente. Verifique proxies corporativos.
- Catálogo/sprites não carregam:
  - Confirme `catalog-content.json` no projeto ou em `<Tibia>/assets/`. Use caminho Tibia correto.
- Tauri IPC não responde:
  - Verifique o console GQL/DevTools, veja logs em Rust (`env_logger` usa `debug` por padrão). Reinicie `npm run tauri dev`.

## 🗺️ Roadmap

- Visualização de sprites individuais.
- Exportação de sprites para PNG/BMP.
- Importação de sprites customizados.
- Editor de propriedades de items.
- Criação de novos items/criaturas.
- Editor de paletas de cores.
- Suporte para minimaps e mapas.

---

https://github.com/user-attachments/assets/3743432a-b795-49c3-a1a9-d7e9045d6f83

Feito com ❤️ usando **Rust + Tauri** e **TypeScript + Vite**.
