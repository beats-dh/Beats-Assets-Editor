# 🎮 Tibia Assets Editor

Um editor moderno e profissional de assets do Tibia 15.x construído com **Rust + Tauri 2** no backend e **TypeScript + Vite 6** no frontend. Permite explorar, editar e gerenciar completamente os assets do Tibia, incluindo appearances (Objects, Outfits, Effects, Missiles), sprites e sons.

![Status](https://img.shields.io/badge/status-beta-green)
![Rust](https://img.shields.io/badge/rust-1.90+-orange)
![Tauri](https://img.shields.io/badge/tauri-2.9+-blue)
![Vite](https://img.shields.io/badge/vite-6.0+-purple)
![TypeScript](https://img.shields.io/badge/typescript-5.6-blue)

## ✨ Descrição do Projeto

**Tibia Assets Editor** é uma aplicação desktop completa e profissional para gerenciamento de assets do Tibia 15.x, oferecendo:

### 🎯 Funcionalidades Principais

- **Parser Completo de Appearances**: Leitura e manipulação de `appearances.dat` via Protocol Buffers (usando `prost 0.14`).
- **Suporte Multi-Categoria**: Objects, Outfits, Effects, Missiles e Sounds.
- **Editor Avançado de Propriedades**: Edição completa de flags, atributos e configurações de appearances.
- **Gerenciamento de Sprites**: Visualização, cache otimizado e preview de sprites com suporte a animações.
- **Sistema de Sons**: Carregamento e gerenciamento de efeitos sonoros, ambient streams, object streams e music templates.
- **Importação/Exportação**: Suporte para exportar e importar appearances em formato JSON.
- **Interface Moderna**: UI responsiva e intuitiva com suporte a múltiplos temas e idiomas (Português, English, Español, Русский).
- **Sistema de Seleção Múltipla**: Seleção e manipulação de múltiplos assets simultaneamente.
- **Infinite Scroll**: Navegação otimizada com scroll infinito para grandes conjuntos de dados.
- **Preview de Animações**: Visualização de animações de outfits e outros assets com controles de playback.

### 🎨 Recursos Avançados

- **Sistema de Temas**: 6 temas profissionais (Default, Ocean, Aurora, Ember, Forest, Dusk).
- **Internacionalização (i18n)**: Interface multilíngue com suporte completo a PT-BR, EN, ES e RU.
- **Cache Inteligente**: Sistema de cache otimizado com DashMap (lock-free) para sprites.
- **Subcategorias de Objects**: Navegação organizada por tipos (Armors, Weapons, Tools, etc.).
- **Special Meaning IDs**: Suporte para IDs especiais do Tibia.
- **Clipboard de Flags**: Copiar e colar propriedades entre appearances.
- **Texture Settings**: Configuração avançada de texturas para appearances.
- **Auto-animação**: Opção de animação automática na grade de assets.

## 📋 Requisitos do Sistema

- **Windows 10/11** (suporte primário; Linux/macOS em desenvolvimento).
- **Node.js 18+** e **npm**.
- **Rust 1.90+** com toolchain MSVC.
- **Pré-requisitos Tauri no Windows**:
  - **Microsoft Visual C++ Build Tools** (Desktop development with C++).
  - **Microsoft Edge WebView2 Runtime** instalado.

### Dependências Principais

**Frontend:**
- `@tauri-apps/api`: ^2
- `@tauri-apps/plugin-dialog`: ^2
- `@tauri-apps/plugin-opener`: ^2
- `vite`: ^6.0.3
- `typescript`: ~5.6.2

**Backend (Rust):**
- `tauri`: 2 (com plugins dialog e opener)
- `prost`: 0.14 (Protocol Buffers)
- `prost-types`: 0.14
- `lzma-rs`: 0.3 (decompressão LZMA)
- `xz2`: 0.1 (decompressão XZ)
- `image`: 0.25 (manipulação de imagens - PNG, JPEG, BMP)
- `serde` + `serde_json`: 1 (serialização)
- `anyhow`: 1.0 + `thiserror`: 2.0 (error handling)
- `log`: 0.4 + `env_logger`: 0.11
- `base64`: 0.22
- `dashmap`: 6.1 (estruturas de dados lock-free)

## 🚀 Instalação e Configuração

### Pré-requisitos

#### 1. Instale o Rust
O projeto requer Rust 1.90 ou superior com toolchain MSVC.

**Windows:**
1. Baixe e instale o **rustup** em [https://rustup.rs/](https://rustup.rs/)
2. Execute o instalador `rustup-init.exe`
3. Escolha a opção padrão de instalação (opção 1)
4. Reinicie o terminal após a instalação
5. Verifique a instalação:
   ```bash
   rustc --version
   cargo --version
   ```

**Alternativa usando winget:**
```bash
winget install Rustlang.Rustup
```

#### 2. Instale Node.js
Necessário Node.js 18 ou superior.

**Windows:**
- Baixe em [https://nodejs.org/](https://nodejs.org/) (recomendado: versão LTS)
- Ou use winget:
  ```bash
  winget install OpenJS.NodeJS.LTS
  ```

Verifique a instalação:
```bash
node --version
npm --version
```

#### 3. Pré-requisitos do Tauri no Windows

**Microsoft Visual C++ Build Tools:**
1. Baixe [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Durante a instalação, selecione "Desktop development with C++"
3. Certifique-se de que os seguintes componentes estão marcados:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools (ou mais recente)
   - Windows 10/11 SDK

**Microsoft Edge WebView2 Runtime:**
- Geralmente já vem instalado no Windows 10/11
- Se necessário, baixe em [https://developer.microsoft.com/microsoft-edge/webview2/](https://developer.microsoft.com/microsoft-edge/webview2/)

### Instalação do Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/tibia-assets-editor.git
   cd tibia-assets-editor
   ```

2. **Instale dependências do frontend:**
   ```bash
   npm install
   ```

3. **Compile as dependências Rust (primeira vez):**
   ```bash
   cd src-tauri
   cargo build
   cd ..
   ```

   **Nota:** A primeira compilação pode demorar vários minutos, pois o Cargo irá baixar e compilar todas as dependências.

4. **(Opcional) Configure variáveis de ambiente para desenvolvimento remoto:**
   - `TAURI_DEV_HOST` — host para HMR remoto (ver [vite.config.ts](vite.config.ts))

### Configurações Relevantes

- [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json): `devUrl = http://localhost:1420`, `frontendDist = ../dist`
- [vite.config.ts](vite.config.ts): Servidor Vite usa porta `1420` e HMR em `1421` (quando `TAURI_DEV_HOST` está definido)
- [tsconfig.json](tsconfig.json): TypeScript estrito com target ES2020

## 📖 Guia de Uso

### Desenvolvimento

```bash
# Iniciar aplicação em modo desenvolvimento (Tauri + Vite)
npm run tauri dev

# Somente frontend (Vite)
npm run dev

# Preview do build do Vite
npm run preview
```

### Build para Produção

```bash
# Criar instalador/executável
npm run tauri build
```

### Fluxo no Aplicativo

1. **Configuração Inicial**:
   - Selecione o diretório do cliente Tibia (detecção automática disponível via `select_tibia_directory`)
   - O caminho é salvo automaticamente para sessões futuras

2. **Carregamento de Assets**:
   - Carregue os appearances automaticamente
   - Sistema detecta e carrega `appearances_latest.dat` ou o arquivo mais recente
   - Sons são carregados automaticamente do diretório `sounds/`

3. **Navegação**:
   - Navegue pelas categorias (Objects, Outfits, Effects, Missiles, Sounds)
   - Use subcategorias para filtrar Objects por tipo
   - Sistema de busca em tempo real
   - Paginação com tamanhos customizáveis (100, 500, 1000, 10000, 50000 itens)

4. **Edição de Assets**:
   - Clique em um asset para ver detalhes completos
   - Use a aba "Edit" para modificar propriedades
   - Use a aba "Texture" para configurações de textura
   - Navegue entre assets usando os botões anterior/próximo

5. **Sprites/Catalog**:
   - A aplicação procura `catalog-content.json` no diretório do projeto
   - Se não existir, tenta em `<Tibia>/assets/catalog-content.json`
   - Cache automático de sprites para performance otimizada

## 🏗️ Estrutura de Arquivos e Diretórios

```
tibia-assets-editor/
├── src/                          # Frontend (TypeScript/HTML/CSS)
│   ├── main.ts                   # Ponto de entrada, inicialização
│   ├── assetUI.ts                # Lógica da grade de assets
│   ├── assetDetails.ts           # Modal de detalhes de assets
│   ├── assetSave.ts              # Lógica de salvamento
│   ├── assetSelection.ts         # Sistema de seleção múltipla
│   ├── animation.ts              # Sistema de animação
│   ├── spriteCache.ts            # Cache de sprites no frontend
│   ├── i18n.ts                   # Sistema de internacionalização
│   ├── navigation.ts             # Navegação entre telas
│   ├── sounds.ts                 # Interface de sons
│   ├── soundTypes.ts             # Tipos de sons
│   ├── textureTab.ts             # Aba de texturas
│   ├── importExport.ts           # Importação/exportação JSON
│   ├── utils.ts                  # Utilitários gerais
│   ├── types.ts                  # TypeScript types
│   ├── specialMeaning.ts         # IDs especiais do Tibia
│   ├── confirmModal.ts           # Modal de confirmação
│   ├── addSoundModal.ts          # Modal de adição de sons
│   ├── eventListeners.ts         # Event listeners globais
│   ├── features/
│   │   ├── assetGrid/            # Layout da grade de assets
│   │   ├── infiniteScroll/       # Scroll infinito
│   │   ├── layout/               # Layout components
│   │   └── previewAnimation/     # Sistema de preview de animações
│   └── styles/                   # CSS modular
│       ├── main.css              # CSS principal (imports)
│       ├── variables.css         # Variáveis CSS
│       ├── theme.css             # Sistema de temas
│       ├── base.css              # Estilos base
│       ├── animations.css        # Animações
│       ├── buttons.css           # Botões
│       ├── forms.css             # Formulários
│       ├── header.css            # Header
│       ├── categories.css        # Categorias
│       ├── assets.css            # Grade de assets
│       ├── modals.css            # Modals
│       ├── search.css            # Busca
│       ├── loading.css           # Loading screen
│       ├── audio.css             # Player de áudio
│       ├── texture.css           # Aba de texturas
│       ├── responsive.css        # Media queries
│       └── utilities.css         # Utilitários
├── index.html                    # HTML base da aplicação
├── src-tauri/                    # Backend (Rust/Tauri)
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Builder Tauri, registro de comandos
│   │   ├── state.rs              # Estado global da aplicação
│   │   ├── core/                 # Módulos core
│   │   │   ├── lzma/             # Decompressão LZMA/XZ
│   │   │   └── protobuf/         # Definições protobuf geradas
│   │   └── features/             # Features organizadas por domínio
│   │       ├── appearances/      # Feature de appearances
│   │       │   ├── mod.rs
│   │       │   ├── types.rs      # Tipos e estruturas
│   │       │   ├── parsers/      # Parsers de appearances
│   │       │   └── commands/     # Comandos Tauri
│   │       │       ├── io.rs     # Load/save/list files
│   │       │       ├── query.rs  # Consultas e filtros
│   │       │       ├── update.rs # Atualizações de properties
│   │       │       ├── import_export.rs # JSON import/export
│   │       │       ├── conversion.rs    # Conversões de tipos
│   │       │       ├── helpers.rs       # Funções auxiliares
│   │       │       └── category_types.rs # Tipos de categorias
│   │       ├── sprites/          # Feature de sprites
│   │       │   ├── mod.rs
│   │       │   ├── parsers/      # SpriteLoader
│   │       │   └── commands/     # Comandos de sprites
│   │       ├── sounds/           # Feature de sons
│   │       │   ├── mod.rs
│   │       │   ├── parsers/      # Parser de sounds.dat
│   │       │   └── commands/     # Comandos de sons
│   │       └── settings/         # Configurações persistentes
│   ├── protobuf/                 # Arquivos .proto
│   │   ├── appearances.proto     # Schema de appearances
│   │   └── sounds.proto          # Schema de sounds
│   ├── build.rs                  # Build script (compila protobuf)
│   ├── tauri.conf.json           # Configuração Tauri
│   ├── capabilities/             # Permissões e capabilities
│   │   └── default.json
│   ├── icons/                    # Ícones da aplicação
│   └── Cargo.toml                # Dependências Rust
├── package.json                  # Scripts NPM e deps frontend
├── tsconfig.json                 # Config TypeScript (strict)
├── vite.config.ts                # Config Vite (porta 1420)
└── README.md                     # Este arquivo
```

## 🧪 Desenvolvimento

### Testes Rust

```bash
cd src-tauri
cargo test

# Teste específico com output
cargo test test_load_tibia_appearances -- --ignored --nocapture
```

### Scripts NPM

- `npm run dev`: Inicia Vite dev server
- `npm run build`: Compila TypeScript e cria build Vite
- `npm run preview`: Preview do build
- `npm run tauri`: CLI do Tauri (dev/build/etc)

### Estrutura de Features (Backend)

O backend segue uma arquitetura modular baseada em features:

- **appearances**: Gerenciamento de appearances (Objects, Outfits, Effects, Missiles)
- **sprites**: Carregamento e cache de sprites
- **sounds**: Gerenciamento de sons e efeitos sonoros
- **settings**: Configurações persistentes da aplicação

Cada feature contém:
- `mod.rs`: Exportações públicas
- `types.rs`: Tipos e estruturas de dados
- `parsers/`: Lógica de parsing
- `commands/`: Comandos Tauri (API IPC)

## 🔌 Comandos Tauri (IPC)

### IO de Appearances

- `select_tibia_directory() -> string`: Detecta automaticamente caminhos comuns do Tibia no Windows
- `list_appearance_files(tibia_path: string) -> string[]`: Lista arquivos `appearances-*.dat` em `<Tibia>/assets`
- `load_appearances_file(path: string) -> AppearanceStats`: Decodifica protobuf (com fallback LZMA/XZ)
- `get_appearance_stats() -> AppearanceStats`: Estatísticas totais por categoria
- `save_appearances_file() -> number`: Serializa e grava no caminho carregado

### Consulta e Detalhes

- `list_appearances_by_category(category, page, page_size, search?, subcategory?) -> AppearanceItem[]`: Listagem paginada com filtro
- `find_appearance_position(category, id) -> number`: Encontra posição de um appearance
- `get_appearance_details(category, id) -> AppearanceDetails`: Informações de frame groups e sprites
- `get_complete_appearance(category, id) -> CompleteAppearanceItem`: Estrutura completa (flags, frameGroups, spriteInfo)
- `get_appearance_count(category, search?, subcategory?) -> number`: Contagem para paginação
- `get_item_subcategories() -> [key, label][]`: Pares chave/rótulo para filtros
- `get_special_meaning_ids() -> SpecialMeaningIds`: IDs especiais do Tibia

### Atualizações de Appearances

#### Básicas
- `update_appearance_name(category, id, new_name) -> AppearanceItem`
- `update_appearance_description(category, id, new_description) -> AppearanceItem`
- `update_appearance_flag_bool(category, id, flag, value) -> AppearanceItem`: Ativa/desativa flags booleanas

#### Propriedades Específicas
- `update_appearance_light(category, id, brightness?, color?) -> AppearanceItem`
- `update_appearance_shift(category, id, x?, y?) -> AppearanceItem`
- `update_appearance_height(category, id, elevation?) -> AppearanceItem`
- `update_appearance_write(category, id, max_text_length?) -> AppearanceItem`
- `update_appearance_write_once(category, id, max_text_length_once?) -> AppearanceItem`
- `update_appearance_automap(category, id, color?) -> AppearanceItem`
- `update_appearance_hook(category, id, type?, direction?) -> AppearanceItem`
- `update_appearance_lenshelp(category, id, lenshelp_id?) -> AppearanceItem`
- `update_appearance_clothes(category, id, slot?) -> AppearanceItem`
- `update_appearance_default_action(category, id, action?) -> AppearanceItem`

#### Propriedades de Mercado e Sistema
- `update_appearance_market(category, id, market_data) -> AppearanceItem`
- `update_appearance_bank(category, id, waypoints?) -> AppearanceItem`
- `update_appearance_changed_to_expire(category, id, former_object_typeid?) -> AppearanceItem`
- `update_appearance_cyclopedia_item(category, id, cyclopedia_type?) -> AppearanceItem`
- `update_appearance_upgrade_classification(category, id, upgrade_classification?) -> AppearanceItem`

#### Propriedades Avançadas
- `update_appearance_skillwheel_gem(category, id, gem_type?, visual_id?) -> AppearanceItem`
- `update_appearance_imbueable(category, id, imbuement_slot?, base_imbuement_slot?) -> AppearanceItem`
- `update_appearance_proficiency(category, id, proficiency_name?) -> AppearanceItem`
- `update_appearance_transparency_level(category, id, level?) -> AppearanceItem`
- `update_appearance_weapon_type(category, id, weapon_type?) -> AppearanceItem`
- `update_appearance_texture_settings(category, id, texture_data) -> AppearanceItem`

### Importação/Exportação e Gerenciamento

- `export_appearance_to_json(category, id) -> string`: Exporta appearance para JSON
- `import_appearance_from_file(category, path, mode?, new_id?) -> AppearanceItem[]`: Importa aparências em JSON ou AEC
- `duplicate_appearance(category, source_id) -> AppearanceItem`: Duplica um appearance
- `create_empty_appearance(category) -> AppearanceItem`: Cria novo appearance vazio
- `copy_appearance_flags(category, id) -> void`: Copia flags para clipboard
- `paste_appearance_flags(category, id) -> AppearanceItem`: Cola flags do clipboard
- `delete_appearance(category, id) -> void`: Remove um appearance
- `export_appearances_to_aec(category, start_id, end_id, path, include_sprites?) -> number`: Exporta um intervalo como arquivo .aec

### Sprites

- `load_sprites_catalog(catalog_path, assets_dir) -> number`: Inicializa SpriteLoader
- `auto_load_sprites(tibia_path) -> number`: Usa `catalog-content.json` (projeto ou `<Tibia>/assets`)
- `get_sprite_by_id(sprite_id) -> base64`: Converte sprite para PNG em base64
- `get_appearance_sprites(category, appearance_id) -> base64[]`: Retorna todos os sprites (usa cache)
- `get_appearance_preview_sprite(category, appearance_id) -> base64?`: Retorna primeiro sprite como preview
- `clear_sprite_cache() -> number`: Limpa cache de sprites
- `get_sprite_cache_stats() -> [entries, sprites]`: Estatísticas do cache

### Sounds

#### Consulta de Sons
- `load_sounds_file(sounds_dir) -> SoundStats`: Carrega sons do diretório
- `get_sounds_stats() -> SoundStats`: Estatísticas de sons
- `list_sound_types() -> string[]`: Lista tipos de sons disponíveis
- `get_sound_by_id(sound_id) -> SoundInfo`: Obtém informações de um som
- `get_sounds_by_type(sound_type) -> SoundInfo[]`: Lista sons por tipo
- `list_all_sounds() -> SoundInfo[]`: Lista todos os sons
- `get_sound_audio_data(sound_id) -> base64`: Dados de áudio em base64
- `get_sound_file_path(sound_id) -> string`: Caminho do arquivo de som

#### Numeric Sound Effects
- `list_numeric_sound_effects() -> NumericSoundEffect[]`: Lista efeitos sonoros numéricos
- `get_numeric_sound_effect_by_id(effect_id) -> NumericSoundEffect`: Obtém efeito por ID
- `get_sound_effect_count() -> number`: Contagem de efeitos

#### Ambience Streams
- `list_ambience_streams() -> AmbienceStream[]`: Lista streams de ambiente
- `get_ambience_stream_by_id(stream_id) -> AmbienceStream`: Obtém stream por ID
- `get_ambience_stream_count() -> number`: Contagem de streams

#### Ambience Object Streams
- `list_ambience_object_streams() -> AmbienceObjectStream[]`: Lista object streams
- `get_ambience_object_stream_by_id(stream_id) -> AmbienceObjectStream`: Obtém por ID
- `get_ambience_object_stream_count() -> number`: Contagem

#### Music Templates
- `list_music_templates() -> MusicTemplate[]`: Lista templates de música
- `get_music_template_by_id(template_id) -> MusicTemplate`: Obtém template por ID
- `get_music_template_count() -> number`: Contagem de templates

#### Atualizações de Sons
- `update_sound_info(sound_id, name?, category?) -> SoundInfo`: Atualiza informações básicas
- `update_numeric_sound_effect(effect_id, data) -> NumericSoundEffect`: Atualiza efeito
- `update_ambience_stream(stream_id, data) -> AmbienceStream`: Atualiza stream
- `update_ambience_object_stream(stream_id, data) -> AmbienceObjectStream`: Atualiza object stream
- `update_music_template(template_id, data) -> MusicTemplate`: Atualiza template

#### Gerenciamento de Sons
- `save_sounds_file() -> number`: Salva alterações
- `add_sound(sound_data) -> SoundInfo`: Adiciona novo som
- `delete_sound(sound_id) -> void`: Remove som
- `add_numeric_sound_effect(effect_data) -> NumericSoundEffect`: Adiciona efeito
- `delete_numeric_sound_effect(effect_id) -> void`: Remove efeito
- `import_and_add_sound(file_path, name?, category?) -> SoundInfo`: Importa arquivo de som

### Settings

- `set_tibia_base_path(tibia_path: string) -> void`: Persiste caminho em `settings.json`
- `get_tibia_base_path() -> string | null`: Obtém caminho persistido

## 🧱 Tipos e Categorias

### AppearanceCategory
- `Objects`: Itens, decorações, equipamentos
- `Outfits`: Roupas e looks
- `Effects`: Efeitos visuais
- `Missiles`: Projéteis

### ItemSubcategory
Subcategorias de Objects:
- **Equipamentos**: `Armors`, `Amulets`, `Boots`, `HelmetsHats`, `Legs`, `Rings`, `Shields`
- **Armas**: `Axes`, `Clubs`, `DistanceWeapons`, `Swords`, `WandsRods`
- **Consumíveis**: `Food`, `Potions`, `Runes`
- **Outros**: `Containers`, `Decoration`, `Tools`, `Valuables`, `Ammunition`, `PremiumScrolls`, `TibiaCoins`, `CreatureProducts`, `Quiver`, `Soulcores`, `Others`

## 🎨 Sistema de Temas

O aplicativo suporta 6 temas visuais:
1. **Default**: Azul/roxo profissional
2. **Ocean**: Tons de azul oceânico
3. **Aurora**: Roxo/rosa vibrante
4. **Ember**: Laranja/vermelho quente
5. **Forest**: Verde natural
6. **Dusk**: Dourado/azul crepuscular

Temas são aplicados via classes CSS e persistidos no localStorage.

## 🌍 Internacionalização

Suporte completo a 4 idiomas:
- **Português (pt-BR)**: Idioma padrão
- **English (en)**
- **Español (es)**
- **Русский (ru)**

Sistema i18n implementado com:
- Traduções dinâmicas via atributos `data-i18n`
- Placeholders traduzidos
- Formatação de números e contadores
- Persistência de preferência no localStorage

## 🤝 Contribuição

1. **Fork** o repositório e crie uma branch descritiva (ex.: `feat/sprite-editor`, `fix/cache-leak`)
2. **Commits semânticos**:
   - `feat:` para novas funcionalidades
   - `fix:` para correções
   - `refactor:` para refatorações
   - `docs:` para documentação
3. **Garanta qualidade**:
   - Execute `npm run tauri dev` e teste a funcionalidade
   - Execute `cargo test` para testes Rust
   - Mantenha TypeScript strict mode
4. **Estilo de código**:
   - TypeScript: Configuração strict do [tsconfig.json](tsconfig.json)
   - Rust: Use `cargo fmt` antes de commitar
   - CSS: Use variáveis CSS existentes e padrões de nomenclatura
5. **Pull Request**:
   - Descrição clara da mudança
   - Screenshots para mudanças de UI
   - Passos de teste detalhados

## 📜 Licença

Este projeto está licenciado sob a **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License** (CC BY-NC-SA 4.0).

### O que isso significa:

✅ **Você PODE:**
- Usar o software para fins pessoais e educacionais
- Visualizar, estudar e aprender com o código
- Modificar e adaptar o software
- Compartilhar suas modificações (sob a mesma licença)
- Contribuir com melhorias para o projeto

❌ **Você NÃO PODE:**
- Usar o software para fins comerciais
- Vender o software ou versões modificadas
- Usar em ambientes corporativos/empresariais com fins lucrativos
- Incluir em produtos ou serviços comerciais

### Atribuição Obrigatória

Ao usar ou distribuir este software, você deve dar crédito apropriado:
```
Based on Tibia Assets Editor (https://github.com/seu-usuario/tibia-assets-editor)
by Tibia Assets Editor Contributors, licensed under CC BY-NC-SA 4.0
```

### Uso Comercial

Para uso comercial, entre em contato com o mantenedor do projeto para obter uma licença comercial separada.

**Licença completa:** Veja o arquivo [LICENSE](LICENSE) para detalhes completos.

**Texto legal oficial:** https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode

## 🧰 Troubleshooting

### Problemas Comuns

**Porta 1420 ocupada:**
- Feche outros processos usando a porta ou ajuste `vite.config.ts`
- Tauri falha se a porta fixa não estiver disponível

**Erro de build no Windows (linker/MSVC):**
- Instale **Microsoft C++ Build Tools** (Desktop development with C++)
- Reinicie o terminal/IDE após instalação

**WebView2 não encontrado:**
- Instale **Microsoft Edge WebView2 Runtime**
- Download: https://developer.microsoft.com/microsoft-edge/webview2/

**npm install falha:**
- Use Node.js 18 ou superior
- Limpe cache: `npm cache clean --force`
- Delete `node_modules` e `package-lock.json`, execute `npm install` novamente
- Verifique configurações de proxy corporativo

**Catálogo/sprites não carregam:**
- Confirme existência de `catalog-content.json` no projeto ou `<Tibia>/assets/`
- Verifique permissões de leitura dos arquivos
- Use o caminho correto do Tibia no setup

**Tauri IPC não responde:**
- Verifique console do DevTools (F12) para erros JavaScript
- Verifique logs Rust no terminal (env_logger usa nível `debug`)
- Reinicie aplicação: `npm run tauri dev`

**Build Rust falha com erro de protobuf:**
- O projeto usa `protoc-bin-vendored` (protoc embutido)
- Se persistir, limpe: `cargo clean`
- Reconstrua: `cargo build`

**Performance lenta com muitos assets:**
- Reduza tamanho de página (100 ou 500 itens)
- Limpe cache de sprites: Settings → Clear sprite cache
- Desative animação automática se habilitada

## 🗺️ Roadmap

### Implementado ✅
- ✅ Sistema completo de appearances
- ✅ Gerenciamento de sprites com cache
- ✅ Sistema de sons completo
- ✅ Editor de propriedades avançado
- ✅ Importação/exportação JSON
- ✅ Sistema de temas e i18n
- ✅ Seleção múltipla de assets
- ✅ Preview de animações
- ✅ Subcategorias de objects
- ✅ Clipboard de flags

### Planejado 🔲
- 🔲 **Editor de Sprites**: Importação e edição de sprites customizados
- 🔲 **Editor de Paletas**: Modificação de paletas de cores
- 🔲 **Export de Sprites**: Exportação individual/batch para PNG/BMP
- 🔲 **Criação de Assets**: Wizard para criar novos items/criaturas
- 🔲 **Histórico de Alterações**: Undo/redo de modificações
- 🔲 **Validação de Assets**: Verificação de integridade e erros
- 🔲 **Batch Operations**: Operações em lote para múltiplos assets

### Melhorias Futuras 💡
- 💡 Performance: Otimizações adicionais para datasets grandes (100k+ items)
- 💡 UI/UX: Melhorias de acessibilidade e usabilidade
- 💡 Documentação: Wiki completo e tutoriais em vídeo
- 💡 Testes: Cobertura de testes unitários e integração

---

## 📸 Screenshots

![Tibia Assets Editor Demo](https://github.com/user-attachments/assets/3743432a-b795-49c3-a1a9-d7e9045d6f83)

---

## 🙏 Agradecimentos

Feito com ❤️ usando **Rust + Tauri** e **TypeScript + Vite**.

**Tecnologias principais:**
- [Tauri](https://tauri.app/) - Framework desktop
- [Rust](https://www.rust-lang.org/) - Backend performático
- [TypeScript](https://www.typescriptlang.org/) - Frontend type-safe
- [Vite](https://vitejs.dev/) - Build tool moderno
- [Protocol Buffers](https://protobuf.dev/) - Serialização eficiente

---

**Nota**: Este é um projeto independente e não é afiliado oficialmente com a CipSoft GmbH ou Tibia.
