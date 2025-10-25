Projeto: Regras para implementar o tibia-assets-editor em Rust

Observação de escopo
- Atualização: não haverá suporte a `.spr` nem `.otb`.
- Mantenha foco em Appearances/Protobuf, DAT, OBD, LZMA, Import/Export, Busca/Log/Progresso e fluxos legados necessários.

Princípios fundamentais
- Paridade 1:1: espelhar estrutura, lógica e comportamento do C# em `Assets Editor`.
- Fonte autoritativa: o código C# é a referência. Quando houver dúvida, seguir o C#.
- Sem soluções arbitrárias: não inventar fluxos ou formatos. Replicar até peculiaridades.
- Testes de equivalência: cada módulo Rust deve ler/escrever exatamente como o C#.

Escopo funcional (módulos a portar)
- OBD: decodificação (OBD/ObdDecoder.cs).
- DAT: estruturas, leitura e escrita (DatStructure.cs) — sem dependências de `.spr`.
- LZMA: compressão/descompressão (LZMA.cs) com a mesma semântica.
- Appearances: modelo, serialização protobuf e compatibilidade com `appearances.proto`.
- Import/Export: fluxos de importação e exportação (ImportManager.xaml.cs).
- Busca/Listagem/Exibição: SearchWindow, ShowList, LogView e comportamentos associados.
- Legado: fluxos do LegacyDatEditor, quando aplicável.

Arquitetura e organização em Rust (src-tauri)
- `src-tauri/src/core/` conterá a lógica principal espelhando classes do C#.
  - `core/obd/decoder.rs`
  - `core/dat/{structure.rs, reader.rs, writer.rs}`
  - `core/compression/lzma.rs` (pode usar crate, mantendo semântica/paridade de I/O).
  - `core/appearances/{mod.rs, types.rs}` + geração protobuf via `prost`.
  - `core/common/{io.rs, bytes.rs}` para utilitários compartilhados.
- `src-tauri/src/commands/` expõe comandos Tauri equivalentes às ações do WPF.
- `lib.rs` agrega módulos; `main.rs` inicializa Tauri e registra comandos.

Compatibilidade binária e formatos
- Endianness, alinhamento, offsets, flags: replicar exatamente o que o C# faz.
- Ao escrever arquivos (DAT, appearances), produzir saída byte-a-byte idêntica.
- Não alterar schemas/headers, versões ou marcações proprietárias.
- Para compressão, replicar blocos, tamanhos e checks usados no C#.

Protobuf e Appearances
- Usar `src-tauri/protobuf/appearances.proto` e `shared.proto` como fonte única.
- Gerar tipos com `prost` sem alterações de nomes/campos.
- Validar round-trip: carregar `appearances_latest.dat`, desserializar/serializar e comparar bytes.
- Manter compatibilidade com `Appearances.cs` e `appearances.proto` da pasta C#.

Erros, logging e progresso
- Mapear exceptions do C# para `Result<T, E>` em Rust com `thiserror`.
- Níveis de log: replicar comportamento do `LogView` (info, warn, error).
- Progresso em operações longas: emitir eventos/updates equivalentes aos do WPF.

UI e integração com Tauri
- Cada ação/fluxo do WPF vira um comando Tauri com a mesma entrada/saída.
- Não mudar fluxo de telas: preservar sequência e estados, adaptando para webview.
- Operações que bloqueiam: mover para threads de trabalho (tauri async), com feedback.

Testes e validação
- Testes unitários por módulo (obd, dat, appearances, lzma) cobrindo casos do C#.
- Testes de integração com “golden files” do projeto (incluindo `appearances_latest.dat`).
- Comparação byte-a-byte nas saídas e igualdade estrutural nos objetos.
- Usar `src-tauri/tests/test_appearances.rs` como ponto de partida e expandir.

Performance e memória
- Não introduzir regressões significativas (tempo/memória) vs C#.
- Preferir leitura/streaming quando C# também o faz; evitar buffers desnecessários.

Convenções de código Rust
- Sem `unsafe` (a menos que necessário e justificado); seguir padrões idiomáticos.
- Nomes, módulos e funções espelhando os do C# com tradução natural ao Rust.
- Documentar funções públicas com objetivo e equivalência ao C#.
- Ativar `clippy` e corrigir avisos sem alterar semântica.

Mapeamento C# → Rust (diretivas)
- `Assets Editor/OBD/ObdDecoder.cs` → `core/obd/decoder.rs`
- `Assets Editor/DatStructure.cs` → `core/dat/structure.rs`
- `Assets Editor/LZMA.cs` → `core/compression/lzma.rs`
- `Assets Editor/Appearances.cs` → `core/appearances/mod.rs`
- (Removidos: OTB e SPR, incluindo `BinaryTreeReader.cs`, `BinaryTreeWriter.cs`, `OTBReader.cs`, `OTBWriter.cs`, `Sprite.cs`, `ImageExporter.cs`).

Critérios de aceite por módulo
- Leitura: estruturas Rust idênticas aos objetos C# (campos/valores/ordens).
- Escrita: arquivo de saída idêntico byte-a-byte ao gerado pelo C#.
- Erros: mesmas condições disparam erros equivalentes, com mensagens claras.
- UI: comandos expostos cobrem os mesmos fluxos e estados.

Processo de migração
1) Escolher um módulo (ex.: Appearances ou DAT). 2) Implementar leitura. 3) Implementar escrita.
4) Adicionar testes com arquivos reais. 5) Comparar contra C#. 6) Expor comandos Tauri.

Resolução de ambiguidades
- Priorizar comportamento do C# verificado em arquivos/execuções reais.
- Se necessário, documentar a decisão e adicionar teste fixando o comportamento.

Checklist antes de finalizar um módulo
- Testes unitários e de integração passam (incl. golden files).
- Saídas idênticas vs C# (comparação binária).
- Logs/progresso emitidos conforme o WPF.
- Comandos Tauri expostos e usados pelo frontend.