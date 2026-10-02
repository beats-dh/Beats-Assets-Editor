# Plan: Extrair/editar recursos do `.rcc` **e** do `.exe` (recursos Qt compilados)

## Goal

Permitir, no RCC Browser do Canary Studio, **abrir o `client.exe`** (além do
`.rcc` já suportado) e **extrair/visualizar/editar qualquer recurso** embutido —
`.json`, `.txt`, `.qml`, `.css`, `.png`, etc. O `.exe` é fonte **somente-leitura**:
edições são exportadas para disco (nunca regravadas no binário).

## Escopo (decisões do usuário)

- Extrair **tudo** (qualquer tipo), não só `.json`.
- `.exe` **não** é regravado (sem patch de PE). Editar → "Salvar no disco".
- Reaproveitar o `RccBrowser` existente (um único editor para `.rcc` e `.exe`).

## Descobertas técnicas (confirmadas em `IglaOTS/bin/client.exe`)

- O `.exe` **não tem header `qres`**: os recursos Qt estão compilados como arrays
  `qt_resource_{struct,name,data}` no `.rdata`, comprimidos com **zlib**.
- O binário contém **22+ bundles Qt separados** (um por `qInitResources_*`), muitos
  minúsculos (2–3 nomes). Reconstrução perfeita da árvore nome→caminho a partir de
  um binário stripado e multi-bundle é **frágil** (heurística não fecha 100%).
- **Porém** a varredura de streams zlib recupera **todos os ~268 arquivos** de forma
  confiável; validado: `spells.json` (344.713 B) volta **byte-idêntico**. Só os
  *nomes/caminhos* ficam sintéticos nesse caminho.
- Estratégia adotada: tentar reconstrução de árvore (caminhos reais quando possível);
  cair para **zlib-scan** que agrupa em `recovered/<tipo>/<tipo>_NNNN.<ext>` com tipo
  detectado por conteúdo (json/png/qml/txt/bin). Extração — o requisito real — sempre
  funciona; nomes do `.exe` são best-effort.

## Arquivos afetados

- [x] `src-tauri/src/features/rcc/qt_format.rs` (novo) — primitivas compartilhadas do
      formato qres (nomes UTF-16BE, payload, zlib, flags), reusadas por ambos parsers.
- [x] `src-tauri/src/features/rcc/rcc_parser.rs` — refatorado p/ usar `qt_format`;
      `build_paths` exposto (`pub`) p/ reuso. Comportamento do `.rcc` inalterado.
- [x] `src-tauri/src/features/rcc/pe_qt_parser.rs` (novo) — localiza bundles Qt no
      binário (names/struct/data) + fallback zlib-scan; `parse_pe_resources()`.
- [x] `src-tauri/src/features/rcc/exe_commands.rs` (novo) — comandos `exe_*`
      (read-only): `exe_find_files/load/get_resource/get_files/replace_resource/
      extract_all/extract_single`. `exe_load` roda em `spawn_blocking`.
- [x] `src-tauri/src/features/rcc/commands.rs` — `safe_output_path` exposto p/ reuso.
- [x] `src-tauri/src/features/rcc/mod.rs` — novos módulos exportados.
- [x] `src-tauri/src/lib.rs` — 7 comandos `exe_*` registrados no `generate_handler!`.
- [x] `src/commands.ts` — nomes `EXE_*` no union `CommandName`.
- [x] `src/lib/components/RccBrowser.svelte` — botão "Abrir EXE"; modo `rcc|exe`;
      conjunto de comandos derivado por modo; em `.exe`, ações de mutação do bundle
      (add/save/replace/delete) ocultas e edição de texto salva via "Salvar no disco";
      badge RCC/EXE no título.
- [x] `src/i18n.ts` — chaves `rcc.btn.openExe`, `rcc.btn.saveText`,
      `rcc.btn.saveToDisk`, `rcc.dialog.openExeTitle` (PT-BR/EN/ES/RU).

## Validação

- [x] `cargo check` — exit 0 (só warning pré-existente em `proficiency/mod.rs`).
- [x] `cargo test --lib` — 24 passed, 0 failed. Inclui teste opt-in
      `real_exe_when_env_set` (via `CANARY_TEST_EXE`) que confirma por **conteúdo**
      que `spells.json` é recuperado do `client.exe`.
- [x] `npx tsc --noEmit` — limpo.
- [x] `rustfmt` aplicado só aos arquivos tocados (sem churn global).

## Rodada 2 — vista combinada, raw recovery e save cruzado (feito)

- [x] **Abrir `.exe` e `.rcc` juntos**: `RccBrowser` agora mantém os dois slots
      (`rccFiles`/`exeFiles`), lista unificada com **tag de origem por linha**
      (RCC/EXE), auto-load de ambos no mount, e roteia get/replace/extract pela
      origem do arquivo selecionado. "Extrair tudo" exporta as duas fontes em
      subpastas `rcc/` e `exe/`.
- [x] **Recursos RAW do `.exe`**: além do zlib-scan, o parser agora **recorta PNGs
      crus por assinatura** (`\x89PNG…IEND`+CRC) — cobre imagens não comprimidas
      sem falsos positivos. Teste `carves_raw_png_from_noise` valida o recorte.
- [x] **Save cruzado exe→rcc**: ao editar um recurso do `.exe`, se existir um
      gêmeo (mesmo path, senão mesmo nome) no `.rcc` carregado, a edição é
      **gravada no `.rcc`** (o cliente reconhece). Sem gêmeo → exporta pro disco.
      O botão de salvar mostra "Salvar no RCC" / "Salvar no disco" conforme o caso.

### Investigação registrada (por que nomes reais do `.exe` ficam fora)

Provado por protótipos: o `client.exe` tem **~37+ bundles Qt minúsculos** (2–3
nomes), **intercalados com os dados** e **sem `qt_resource_struct` localizável**.
A tabela de nomes do `spells.json` existe (em `0x1abab00`) logo antes dos dados,
mas atribuir nome por **proximidade erra** (no teste, rotulou `spells.json` como
`spells-previews.json`; só 3/268 blobs nomeados). Shippar isso daria nomes
**errados** — pior que nomes sintéticos honestos. Por isso o `.exe` mantém
`recovered/<tipo>/<tipo>_NNNN.<ext>`.

## Rodada 3 — aplicar no cliente de verdade (writeback) + ícones (feito)

Inspirado no tool Python de referência (`leobaitola/grm`), que **regrava** e o
cliente reconhece. Portado fielmente para Rust (sem dependência do `rcc.exe`/Qt):

- [x] **Embed JSON in-place no `client.exe`** (`pe_qt_writer.rs` +
      `exe_apply_to_client`): acha o slot zlib do `spells.json`/`spells-previews.json`,
      minifica o JSON novo, **completa com espaços** até o tamanho descomprimido
      original (whitespace válido → valor idêntico e campo de tamanho intacto),
      recomprime zlib nível 9, exige caber no slot, **zero-pad** o resto e escreve
      no MESMO offset. Layout do PE não muda → seguro. Backup `client.original.exe`.
- [x] **Patch de caminho** (`patch_spell_paths`): troca `./spells/…`↔`:/spells/…`
      (mesmo comprimento) pro cliente ler a versão embutida. Idempotente.
- [x] **`.rcc` recompilar+instalar** (`rcc_install_to_client`): reconstrói o bundle
      via `rcc_writer` (Rust, **sem limite de tamanho** → permite add/expand de
      ícones), backup `graphics_resources.original.rcc`, escreve atômico por cima do
      `graphics_resources.rcc`. Round-trip provado lossless nas 1070 entradas reais.
- [x] **Ícones de magia** (`spell_icons.rs` + comandos `rcc_*_spell_icon`):
      add/replace/remove/swap nos sheets `spell-icons-32x32.png` e `-20x20.png` em
      lockstep (crate `image`), expandindo o sheet quando necessário. Depois é só
      "Instalar no cliente" pra recompilar o `.rcc`.
- [x] **UI**: botões "Aplicar no cliente" (exe, em JSON de spell), "Instalar no
      cliente" (rcc) e add/remover ícone quando um sheet de spell está selecionado;
      confirmação + avisos de backup; i18n nos 4 idiomas.

### Limites honestos do writeback
- **Embed no exe**: o JSON novo (comprimido) precisa **caber no slot original**.
  JSON minificado quase sempre cabe; adicionar muita coisa pode estourar (erro claro).
- **Ícones/`.rcc`**: sem limite (recompila o bundle inteiro).
- Por que o meu writeback antigo "não aplicava": eu só exportava pro disco; o cliente
  lê de dentro do `.exe`/`.rcc`. Agora regravo no lugar certo, igual ao tool Python.

## Validação rodada 3
- [x] `cargo test --lib` — **35 passed, 0 failed**. Inclui: `pe_qt_writer`
      (embed roundtrip real no `client.exe` + re-detecção idempotente),
      `rcc_writer` (roundtrip real lossless no `.rcc`), `spell_icons` (4 ops).
- [x] `npx tsc --noEmit` limpo · `cargo check` limpo · `rustfmt` nos arquivos tocados.

## Pendências / melhorias futuras (fora do escopo atual)

- [ ] Nomes/caminhos Qt reais para os recursos do `.exe` (exigiria reconstrução
      multi-bundle confiável — hoje inviável neste binário, ver acima).
- [ ] Recorte de outros tipos raw além de PNG (precisam de marcador de fim
      confiável; JPG/og­g/etc. não têm um tão simples quanto o IEND do PNG).
- [ ] Suporte a `zstd` (Qt ≥ 5.13) — hoje detectado e reportado como não suportado.
- [ ] (Opcional) `.rcc` save preservando compressão (writer atual grava raw v1).

## Notas

- `.exe` read-only por decisão do usuário e por segurança (BattlEye presente).
- Editar disco cobre o caso real: os JSON do `.exe` espelham os do disco
  (`spells/spells.json` idêntico), e o client tem `FORCE_PATCH`/`--patch.*`.
