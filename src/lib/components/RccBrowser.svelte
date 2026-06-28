<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { COMMANDS } from "../../commands";
    import { assetsState } from "../../stores/assetsState.svelte";
    import { appState } from "../../stores/appState.svelte";
    import { openConfirmModal } from "../../stores/confirmState.svelte";
    import { openPromptModal } from "../../stores/promptState.svelte";
    import { open, save } from "@tauri-apps/plugin-dialog";
    import { onMount } from "svelte";
    import { translate } from "../../i18n";
    import SpriteGrid from "./SpriteGrid.svelte";
    import SpellEditorPanel from "./spell-editor/SpellEditorPanel.svelte";

    const RCC_CACHE_KEY = "lastRccPath";
    const EXE_CACHE_KEY = "lastExePath";

    type Source = "rcc" | "exe";

    interface RccFileInfo {
        index: number;
        name: string;
        path: string;
        size: number;
        compressed: boolean;
    }

    /** A resource in the unified list, tagged with the source it came from. */
    interface UIFile extends RccFileInfo {
        source: Source;
    }

    interface RccLoadResult {
        files: RccFileInfo[];
        total_files: number;
        total_size: number;
        version: number;
    }

    // Per-source state — both sources can be loaded at the same time.
    let rccFiles = $state<RccFileInfo[]>([]);
    let exeFiles = $state<RccFileInfo[]>([]);
    let rccPath = $state("");
    let exePath = $state("");
    let rccVersion = $state(0);

    // Unified, source-tagged list shown in the UI.
    let files = $derived<UIFile[]>([
        ...rccFiles.map((f) => ({ ...f, source: "rcc" as const })),
        ...exeFiles.map((f) => ({ ...f, source: "exe" as const })),
    ]);

    let selectedFile = $state<UIFile | null>(null);
    let previewUrl = $state<string | null>(null);
    let audioUrl = $state<string | null>(null);
    let textContent = $state<string | null>(null);
    let originalTextContent = $state<string | null>(null);
    let textModified = $state(false);
    let hexPreview = $state<string | null>(null);
    // True when the selected exe resource can be written back into the binary
    // in place (it has a physical slot recorded during the scan).
    let canApplyToExe = $state(false);

    // Sprite-grid editing state (for .rcc image sheets shown as a cell grid).
    interface ImageGridInfo {
        width: number;
        height: number;
        cell: number;
        count: number;
    }
    let gridBytes = $state<Uint8Array | null>(null);
    let gridInfo = $state<ImageGridInfo | null>(null);
    let gridCell = $state(0);
    let gridSelected = $state(-1);
    let gridZoom = $state(2);
    // A sheet is grid-editable when it has more than one cell (a real strip).
    let isGridSheet = $derived(
        selectedFile?.source === "rcc" &&
            gridInfo !== null &&
            gridInfo.count > 1 &&
            gridInfo.cell < gridInfo.width,
    );

    // Structured spell editor: shown for the two spell JSONs, toggled on demand.
    const SPELL_FILE_NAMES = ["spells.json", "spells-previews.json"];
    let isSpellJsonFile = $derived(
        SPELL_FILE_NAMES.includes(selectedFile?.name ?? ""),
    );
    let spellEditorOpen = $state(false);
    // Indices of the two spell JSONs within the selected file's source.
    let spellEditorIndices = $derived.by(() => {
        if (!selectedFile) return { spells: null, previews: null };
        const list = selectedFile.source === "exe" ? exeFiles : rccFiles;
        const find = (n: string) =>
            list.find((f) => f.name === n)?.index ?? null;
        return {
            spells: find("spells.json"),
            previews: find("spells-previews.json"),
        };
    });

    interface DmpEntry {
        field: number;
        value: string;
        offset: number;
    }
    interface DmpInfo {
        magic: string;
        version: number;
        buildTag: string;
        sessionHash: string;
        dataOffset: number;
        entries: DmpEntry[];
        fileSize: number;
    }
    let dmpInfo = $state<DmpInfo | null>(null);
    let searchQuery = $state("");
    let isLoading = $state(false);
    let statusMessage = $state("");

    // True once either source is loaded.
    let hasContent = $derived(rccFiles.length > 0 || exeFiles.length > 0);
    let totalFiles = $derived(files.length);
    let totalSize = $derived(files.reduce((sum, f) => sum + f.size, 0));

    /** Command set for a given source (.rcc = read/write, .exe = read-only). */
    function cmdsFor(source: Source) {
        return source === "exe"
            ? {
                  GET: COMMANDS.EXE_GET_RESOURCE,
                  REPLACE: COMMANDS.EXE_REPLACE_RESOURCE,
                  EXTRACT_ALL: COMMANDS.EXE_EXTRACT_ALL,
                  EXTRACT_SINGLE: COMMANDS.EXE_EXTRACT_SINGLE,
              }
            : {
                  GET: COMMANDS.RCC_GET_RESOURCE,
                  REPLACE: COMMANDS.RCC_REPLACE_RESOURCE,
                  EXTRACT_ALL: COMMANDS.RCC_EXTRACT_ALL,
                  EXTRACT_SINGLE: COMMANDS.RCC_EXTRACT_SINGLE,
              };
    }

    // Filtered view derived from the unified list + search query.
    let filteredFiles = $derived.by(() => {
        const q = searchQuery.toLowerCase();
        return q
            ? files.filter(
                  (f) =>
                      f.name.toLowerCase().includes(q) ||
                      f.path.toLowerCase().includes(q),
              )
            : files;
    });

    // Cleanup blob URLs when they change
    $effect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    });

    // Auto-load both sources on mount, always following the ACTIVE client folder.
    onMount(async () => {
        await autoLoadSource("rcc");
        await autoLoadSource("exe");
    });

    /** Auto-load one source for the currently active client folder.
     *
     *  The active client path (`appState.tibiaPath`) is the source of truth:
     *  whenever it's set we (re)discover from it, so switching clients makes the
     *  browser follow the new folder instead of re-opening the previous client's
     *  files. The cached last-used path is only a fallback for when no client
     *  folder is configured. The "Open .rcc/.exe" buttons stay as the manual
     *  override for ad-hoc files outside the active client. */
    async function autoLoadSource(source: Source) {
        const cacheKey = source === "exe" ? EXE_CACHE_KEY : RCC_CACHE_KEY;
        const findCmd =
            source === "exe"
                ? COMMANDS.EXE_FIND_FILES
                : COMMANDS.RCC_FIND_FILES;

        // Active client folder wins (and follows folder switches). When one is
        // set we never fall back to the cache, so a stale path from another
        // client can't shadow the current one.
        if (appState.tibiaPath) {
            try {
                const found = await invoke<string[]>(findCmd, {
                    basePath: appState.tibiaPath,
                });
                if (found.length > 0) await loadSource(found[0], source);
            } catch {
                // Discovery failed — leave empty; the user can open manually.
            }
            return;
        }

        // No active client folder: fall back to the last-used path.
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                await loadSource(cached, source);
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }
    }

    /** Load one source (.rcc or .exe) into its own slot, keeping the other. */
    async function loadSource(path: string, source: Source) {
        isLoading = true;
        statusMessage = translate("rcc.status.loading");
        try {
            const cmd = source === "exe" ? COMMANDS.EXE_LOAD : COMMANDS.RCC_LOAD;
            const result = await invoke<RccLoadResult>(cmd, { path });
            if (source === "exe") {
                exeFiles = result.files;
                exePath = path;
                localStorage.setItem(EXE_CACHE_KEY, path);
            } else {
                rccFiles = result.files;
                rccVersion = result.version;
                rccPath = path;
                localStorage.setItem(RCC_CACHE_KEY, path);
            }
            selectedFile = null;
            previewUrl = null;
            statusMessage = translate("rcc.status.loaded", {
                count: result.total_files,
                size: formatSize(result.total_size),
            });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
            throw e;
        } finally {
            isLoading = false;
        }
    }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function getFileExtension(name: string): string {
        const dot = name.lastIndexOf(".");
        return dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
    }

    function isImageFile(name: string): boolean {
        const ext = getFileExtension(name);
        return [
            "png",
            "jpg",
            "jpeg",
            "gif",
            "bmp",
            "svg",
            "webp",
            "ico",
        ].includes(ext);
    }

    function isAudioFile(name: string): boolean {
        const ext = getFileExtension(name);
        return ["wav", "ogg", "mp3", "flac"].includes(ext);
    }

    function isTextFile(name: string): boolean {
        const ext = getFileExtension(name);
        return [
            "css",
            "json",
            "js",
            "qml",
            "hints",
            "xml",
            "html",
            "txt",
            "ini",
            "cfg",
        ].includes(ext);
    }

    function getAudioMimeType(name: string): string {
        const mimes: Record<string, string> = {
            wav: "audio/wav",
            ogg: "audio/ogg",
            mp3: "audio/mpeg",
            flac: "audio/flac",
        };
        return mimes[getFileExtension(name)] ?? "audio/octet-stream";
    }

    function getImageMimeType(name: string): string {
        const ext = getFileExtension(name);
        return ext === "svg" ? "image/svg+xml" : `image/${ext}`;
    }

    /** Generate a hex dump string for the first maxBytes bytes */
    function generateHexDump(bytes: Uint8Array, maxBytes: number): string {
        const limit = Math.min(bytes.length, maxBytes);
        const lines: string[] = [];
        for (let i = 0; i < limit; i += 16) {
            const chunk = bytes.slice(i, i + 16);
            const hex = Array.from(chunk)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(" ");
            const ascii = Array.from(chunk)
                .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
                .join("");
            lines.push(
                `${i.toString(16).padStart(8, "0")}  ${hex.padEnd(47)}  ${ascii}`,
            );
        }
        if (bytes.length > maxBytes) {
            lines.push(`... (${bytes.length - maxBytes} more bytes)`);
        }
        return lines.join("\n");
    }

    /** Try to detect if bytes look like text (>90% printable ASCII/UTF-8) */
    function looksLikeText(bytes: Uint8Array): boolean {
        const sample = bytes.slice(0, 512);
        let printable = 0;
        for (const b of sample) {
            if (
                (b >= 0x20 && b < 0x7f) ||
                b === 0x09 ||
                b === 0x0a ||
                b === 0x0d
            ) {
                printable++;
            }
        }
        return printable / sample.length > 0.9;
    }

    function getFileIcon(name: string): string {
        const ext = getFileExtension(name);
        switch (ext) {
            case "png":
            case "jpg":
            case "jpeg":
            case "gif":
            case "bmp":
            case "webp":
                return "🖼️";
            case "svg":
                return "📐";
            case "wav":
            case "ogg":
            case "mp3":
            case "flac":
                return "🔊";
            case "css":
                return "🎨";
            case "fnt":
                return "🔤";
            case "json":
                return "📋";
            case "js":
                return "⚡";
            case "qml":
                return "📄";
            case "qm":
                return "🌐";
            case "hints":
                return "💡";
            case "dmp":
                return "💾";
            default:
                return "📦";
        }
    }

    async function openRccFile() {
        const selected = await open({
            title: translate("rcc.dialog.openTitle"),
            filters: [{ name: "Qt Resource", extensions: ["rcc"] }],
        });
        if (!selected) return;
        try {
            await loadSource(selected as string, "rcc");
        } catch {
            // Error already shown via statusMessage
        }
    }

    async function openExeFile() {
        const selected = await open({
            title: translate("rcc.dialog.openExeTitle"),
            filters: [{ name: "Executable", extensions: ["exe"] }],
        });
        if (!selected) return;
        try {
            await loadSource(selected as string, "exe");
        } catch {
            // Error already shown via statusMessage
        }
    }

    function parseDmpFile(bytes: Uint8Array): DmpInfo | null {
        if (bytes.length < 8) return null;
        const magic = String.fromCharCode(
            bytes[0],
            bytes[1],
            bytes[2],
            bytes[3],
        );
        if (magic !== "dmpd") return null;

        const version = (bytes[4] << 8) | bytes[5];

        // Locate the "@XXXX<hexhash>" block and "|" terminator
        let buildTag = "";
        let sessionHash = "";
        let dataOffset = 80; // fallback

        for (let i = 8; i < Math.min(120, bytes.length); i++) {
            if (bytes[i] === 0x40) {
                // '@'
                buildTag = new TextDecoder().decode(bytes.slice(i, i + 4));
                let hashEnd = i + 4;
                while (hashEnd < bytes.length && bytes[hashEnd] !== 0x7c)
                    hashEnd++;
                sessionHash = new TextDecoder().decode(
                    bytes.slice(i + 4, hashEnd),
                );
                dataOffset = hashEnd + 2; // skip "|X"
                break;
            }
        }

        // Scan for protobuf wire-type-2 fields with printable string values
        // Tag byte: (fieldNumber << 3) | 2
        const entries: DmpEntry[] = [];
        const seen = new Set<string>();

        for (let i = dataOffset; i < bytes.length - 3; i++) {
            const tag = bytes[i];
            if ((tag & 0x7) !== 2) continue; // only wire type 2 (length-delimited)
            const fieldNum = tag >> 3;
            if (fieldNum < 1 || fieldNum > 127) continue;

            // Read varint length (handle 1 or 2-byte variants)
            let len: number;
            let skip: number;
            const b0 = bytes[i + 1];
            if (b0 & 0x80) {
                len = (b0 & 0x7f) | ((bytes[i + 2] & 0x7f) << 7);
                skip = 2;
            } else {
                len = b0;
                skip = 1;
            }

            if (len < 2 || len > 80 || i + 1 + skip + len > bytes.length)
                continue;

            const strBytes = bytes.slice(i + 1 + skip, i + 1 + skip + len);
            let allPrintable = true;
            let alphaCount = 0;
            for (const c of strBytes) {
                if (c >= 0x20 && c <= 0x7e) {
                    if (
                        (c >= 0x41 && c <= 0x5a) ||
                        (c >= 0x61 && c <= 0x7a) ||
                        c === 0x20
                    )
                        alphaCount++;
                } else {
                    allPrintable = false;
                    break;
                }
            }

            if (
                allPrintable &&
                alphaCount / len >= 0.4 &&
                /[a-zA-Z]/.test(String.fromCharCode(...strBytes))
            ) {
                const value = new TextDecoder().decode(strBytes).trim();
                if (value.length >= 2 && !seen.has(value)) {
                    seen.add(value);
                    entries.push({ field: fieldNum, value, offset: i });
                    i += skip + len;
                }
            }
        }

        return {
            magic,
            version,
            buildTag,
            sessionHash,
            dataOffset,
            entries,
            fileSize: bytes.length,
        };
    }

    async function selectResource(file: UIFile) {
        // Cleanup previous blob URLs
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            audioUrl = null;
        }
        textContent = null;
        originalTextContent = null;
        textModified = false;
        hexPreview = null;
        dmpInfo = null;
        selectedFile = file;
        canApplyToExe = false;
        gridBytes = null;
        gridInfo = null;
        gridSelected = -1;

        // Does this exe resource have a physical slot we can write back in place?
        if (file.source === "exe") {
            try {
                canApplyToExe = await invoke<boolean>(
                    COMMANDS.EXE_CAN_APPLY_RESOURCE,
                    { index: file.index },
                );
            } catch {
                canApplyToExe = false;
            }
        }

        try {
            const data = await invoke<number[]>(cmdsFor(file.source).GET, {
                index: file.index,
            });
            const bytes = new Uint8Array(data);

            if (isImageFile(file.name)) {
                const blob = new Blob([bytes], {
                    type: getImageMimeType(file.name),
                });
                previewUrl = URL.createObjectURL(blob);
                // For .rcc PNGs, also probe whether it's a multi-cell strip so
                // we can offer the sprite-grid editor.
                if (file.source === "rcc" && getFileExtension(file.name) === "png") {
                    try {
                        const info = await invoke<ImageGridInfo>(
                            COMMANDS.RCC_IMAGE_INFO,
                            { index: file.index },
                        );
                        gridInfo = info;
                        gridCell = info.cell;
                        gridBytes = bytes;
                    } catch {
                        gridInfo = null;
                    }
                }
            } else if (isAudioFile(file.name)) {
                const blob = new Blob([bytes], {
                    type: getAudioMimeType(file.name),
                });
                audioUrl = URL.createObjectURL(blob);
            } else if (isTextFile(file.name)) {
                let text = new TextDecoder("utf-8").decode(bytes);
                if (getFileExtension(file.name) === "json") {
                    try {
                        text = JSON.stringify(JSON.parse(text), null, 2);
                    } catch {
                        /* keep raw */
                    }
                }
                textContent = text;
                originalTextContent = text;
            } else if (getFileExtension(file.name) === "fnt") {
                // BMFont binary starts with "BMF"; otherwise treat as text
                if (
                    bytes.length >= 3 &&
                    bytes[0] === 66 &&
                    bytes[1] === 77 &&
                    bytes[2] === 70
                ) {
                    hexPreview = generateHexDump(bytes, 512);
                } else if (looksLikeText(bytes)) {
                    const text = new TextDecoder("utf-8").decode(bytes);
                    textContent = text;
                    originalTextContent = text;
                } else {
                    hexPreview = generateHexDump(bytes, 512);
                }
            } else if (getFileExtension(file.name) === "dmp") {
                const parsed = parseDmpFile(bytes);
                if (parsed) {
                    dmpInfo = parsed;
                } else {
                    hexPreview = generateHexDump(bytes, 512);
                }
            } else {
                hexPreview = generateHexDump(bytes, 512);
            }
        } catch (e) {
            console.error("Failed to load preview:", e);
        }
    }

    /** Find an .rcc resource whose path (or name) matches the given file. */
    function matchingRccFile(file: UIFile): RccFileInfo | null {
        const byPath = rccFiles.find((f) => f.path === file.path);
        if (byPath) return byPath;
        // .exe resources have synthetic paths (recovered/…); fall back to name.
        return rccFiles.find((f) => f.name === file.name) ?? null;
    }

    interface EmbedReport {
        name: string;
        compressed_used: number;
        compressed_max: number;
        uncompressed_used: number;
        uncompressed_max: number;
    }
    interface ExeApplyResult {
        embedded: EmbedReport[];
        path_patched: boolean;
    }
    interface SpellDiskResult {
        written_path: string;
        path_patched: boolean;
    }

    // The two spell JSONs additionally support unlimited "disk mode".
    const SPELL_JSONS = ["spells.json", "spells-previews.json"];
    function isSpellJson(name: string): boolean {
        return SPELL_JSONS.includes(name);
    }

    /** If applying to the exe fails because the content doesn't fit the slot,
     *  suggest the right fallback: disk mode for spells, the .rcc for twins,
     *  otherwise disk export. */
    function applyFailureHint(sel: UIFile, err: unknown): string {
        const base = `${translate("rcc.status.applyExeError")}: ${err}`;
        if (isSpellJson(sel.name))
            return `${base} — ${translate("rcc.status.applyExeHintSpellDisk")}`;
        const twin = matchingRccFile(sel);
        if (twin) return `${base} — ${translate("rcc.status.applyExeHintRcc")}`;
        return `${base} — ${translate("rcc.status.applyExeHintDisk")}`;
    }

    /** Apply a spell JSON via DISK MODE — no size limit. Writes the loose file
     *  into the client's spells/ folder and patches the binary to read from
     *  disk. Use this when the embed doesn't fit, or to grow spells freely. */
    async function applySpellToDisk() {
        if (!selectedFile || textContent === null) return;
        if (!isSpellJson(selectedFile.name)) return;
        const sel = selectedFile;
        const confirmed = await openConfirmModal(
            translate("rcc.dialog.applyDiskMsg", { name: sel.name }) +
                `<div class="confirm-warning">${translate("rcc.dialog.applyDiskWarning")}</div>`,
            translate("rcc.dialog.applyDiskTitle"),
            translate("rcc.btn.applyDisk").replace(/^[^\w]*/, ""),
            translate("modal.btn.cancel"),
        );
        if (!confirmed) return;

        isLoading = true;
        statusMessage = translate("rcc.status.applyingDisk");
        try {
            const result = await invoke<SpellDiskResult>(
                COMMANDS.EXE_APPLY_SPELL_TO_DISK,
                { name: sel.name, content: textContent },
            );
            statusMessage = translate("rcc.status.appliedDisk", {
                path: result.written_path,
            });
            originalTextContent = textContent;
            textModified = false;
        } catch (e) {
            statusMessage = `${translate("rcc.status.applyExeError")}: ${e}`;
        } finally {
            isLoading = false;
        }
    }

    /** Embed the currently selected exe resource (the in-memory edited bytes)
     *  back INTO client.exe in place, so the game reads it. Works for ANY
     *  recovered resource that has a slot — text or binary. For the spell JSONs
     *  it also patches the spell paths. Confirms first (rewrites the binary;
     *  a one-time backup is made). Assumes the edit is already in memory. */
    async function applyToClientExe() {
        if (!selectedFile || !canApplyToExe) return;
        const sel = selectedFile;
        const confirmed = await openConfirmModal(
            translate("rcc.dialog.applyExeMsg", { name: sel.name }) +
                `<div class="confirm-warning">${translate("rcc.dialog.applyExeWarning")}</div>`,
            translate("rcc.dialog.applyExeTitle"),
            translate("rcc.btn.applyToClient").replace(/^[^\w]*/, ""),
            translate("modal.btn.cancel"),
        );
        if (!confirmed) return;

        isLoading = true;
        statusMessage = translate("rcc.status.applyingExe");
        try {
            // Persist the current text edit into the exe's in-memory copy first
            // (binary resources are already updated via replace-from-file).
            if (textContent !== null) {
                const bytes = Array.from(new TextEncoder().encode(textContent));
                await invoke<RccFileInfo>(COMMANDS.EXE_REPLACE_RESOURCE, {
                    index: sel.index,
                    data: bytes,
                });
            }
            const result = await invoke<ExeApplyResult>(
                COMMANDS.EXE_APPLY_RESOURCE,
                { index: sel.index },
            );
            const rep = result.embedded[0];
            statusMessage = translate("rcc.status.appliedExe", {
                name: rep.name,
                used: rep.compressed_used,
                max: rep.compressed_max,
            });
            if (textContent !== null) originalTextContent = textContent;
            textModified = false;
            exeFiles = await invoke<RccFileInfo[]>(COMMANDS.EXE_GET_FILES);
        } catch (e) {
            statusMessage = applyFailureHint(sel, e);
        } finally {
            isLoading = false;
        }
    }

    /** Replace a binary exe resource (e.g. PNG) from a file on disk, then apply
     *  it into the binary in place. */
    async function replaceExeResourceFromFile() {
        if (!selectedFile || selectedFile.source !== "exe" || !canApplyToExe)
            return;
        const sel = selectedFile;
        const ext = getFileExtension(sel.name);
        const picked = await open({
            title: translate("rcc.dialog.replaceTitle", { name: sel.name }),
            filters: [
                { name: `Original (${ext})`, extensions: ext ? [ext] : ["*"] },
                { name: "All Files", extensions: ["*"] },
            ],
        });
        if (!picked) return;

        const confirmed = await openConfirmModal(
            translate("rcc.dialog.applyExeMsg", { name: sel.name }) +
                `<div class="confirm-warning">${translate("rcc.dialog.applyExeWarning")}</div>`,
            translate("rcc.dialog.applyExeTitle"),
            translate("rcc.btn.applyToClient").replace(/^[^\w]*/, ""),
            translate("modal.btn.cancel"),
        );
        if (!confirmed) return;

        isLoading = true;
        statusMessage = translate("rcc.status.applyingExe");
        try {
            const result = await invoke<ExeApplyResult>(
                COMMANDS.EXE_REPLACE_RESOURCE_FROM_FILE,
                { index: sel.index, filePath: picked },
            );
            const rep = result.embedded[0];
            statusMessage = translate("rcc.status.appliedExe", {
                name: rep.name,
                used: rep.compressed_used,
                max: rep.compressed_max,
            });
            exeFiles = await invoke<RccFileInfo[]>(COMMANDS.EXE_GET_FILES);
            await selectResource(sel);
        } catch (e) {
            statusMessage = applyFailureHint(sel, e);
        } finally {
            isLoading = false;
        }
    }

    /** Save the currently edited text.
     *  - .rcc: write back into the bundle (client reads the .rcc).
     *  - .exe: the binary is never rewritten. If the same resource also exists
     *    in the loaded .rcc, write the edit there (the client recognises it);
     *    otherwise export the edited file to disk. */
    async function saveTextEdit() {
        if (!selectedFile || textContent === null) return;
        const sel = selectedFile;
        const bytes = Array.from(new TextEncoder().encode(textContent));
        try {
            // Always update the in-memory copy of the source it came from.
            const updated = await invoke<RccFileInfo>(
                cmdsFor(sel.source).REPLACE,
                { index: sel.index, data: bytes },
            );

            if (sel.source === "exe") {
                if (canApplyToExe) {
                    // The resource lives INSIDE client.exe and we have its slot —
                    // embedding in place is the only edit the game actually reads.
                    await applyToClientExe();
                    return;
                }
                const twin = matchingRccFile(sel);
                if (twin) {
                    // Mirror the edit into the .rcc so the client picks it up.
                    await invoke<RccFileInfo>(COMMANDS.RCC_REPLACE_RESOURCE, {
                        index: twin.index,
                        data: bytes,
                    });
                    rccFiles = await invoke<RccFileInfo[]>(
                        COMMANDS.RCC_GET_FILES,
                    );
                    statusMessage = translate("rcc.status.savedToRcc", {
                        name: twin.path || twin.name,
                    });
                } else {
                    // No twin — export to disk (binary stays untouched).
                    const dest = await save({
                        title: translate("rcc.dialog.saveFile", {
                            name: sel.name,
                        }),
                        defaultPath: sel.name,
                    });
                    if (dest) {
                        await invoke(cmdsFor("exe").EXTRACT_SINGLE, {
                            index: sel.index,
                            outputPath: dest,
                        });
                        statusMessage = translate("rcc.status.saved", {
                            path: dest,
                        });
                    }
                }
                // Refresh the exe-side size in its slot.
                exeFiles = await invoke<RccFileInfo[]>(COMMANDS.EXE_GET_FILES);
            } else {
                rccFiles = await invoke<RccFileInfo[]>(COMMANDS.RCC_GET_FILES);
                statusMessage = translate("rcc.status.replaced", {
                    name: updated.name,
                    size: formatSize(updated.size),
                });
            }

            selectedFile = { ...sel, size: bytes.length };
            originalTextContent = textContent;
            textModified = false;
        } catch (e) {
            statusMessage = `Save error: ${e}`;
        }
    }

    function discardTextEdit() {
        if (originalTextContent !== null) {
            textContent = originalTextContent;
            textModified = false;
        }
    }

    /** Load image dimensions from a Uint8Array */
    function getImageDimensions(
        data: Uint8Array<ArrayBuffer>,
        mimeType: string,
    ): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                reject(new Error("Failed to load image"));
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    }

    const EXPECTED_WIDTH = 1920;
    const EXPECTED_HEIGHT = 1080;

    async function replaceResource() {
        if (!selectedFile) return;
        const ext = getFileExtension(selectedFile.name);

        const typeFilters = isImageFile(selectedFile.name)
            ? [
                  {
                      name: "Images",
                      extensions: [
                          "png",
                          "jpg",
                          "jpeg",
                          "bmp",
                          "gif",
                          "svg",
                          "webp",
                          "ico",
                      ],
                  },
              ]
            : isAudioFile(selectedFile.name)
              ? [{ name: "Audio", extensions: ["wav", "ogg", "mp3", "flac"] }]
              : isTextFile(selectedFile.name) ||
                  getFileExtension(selectedFile.name) === "fnt"
                ? [
                      {
                          name: "Text Files",
                          extensions: [
                              "css",
                              "json",
                              "js",
                              "qml",
                              "hints",
                              "xml",
                              "txt",
                              "fnt",
                              "ini",
                          ],
                      },
                  ]
                : [];

        const selected = await open({
            title: translate("rcc.dialog.replaceTitle", {
                name: selectedFile.name,
            }),
            filters: [
                ...typeFilters,
                { name: `Original (${ext})`, extensions: ext ? [ext] : ["*"] },
                { name: "All Files", extensions: ["*"] },
            ],
        });
        if (!selected) return;

        try {
            // Do the replacement (replace-from-file is .rcc only)
            const updated = await invoke<RccFileInfo>(
                COMMANDS.RCC_REPLACE_FROM_FILE,
                { index: selectedFile.index, filePath: selected },
            );

            // Check new image dimensions against expected 1920x1080
            if (isImageFile(selected as string)) {
                try {
                    const newData = await invoke<number[]>(
                        COMMANDS.RCC_GET_RESOURCE,
                        {
                            index: updated.index,
                        },
                    );
                    const dims = await getImageDimensions(
                        new Uint8Array(newData),
                        `image/${getFileExtension(selected as string)}`,
                    );

                    if (
                        dims.width !== EXPECTED_WIDTH ||
                        dims.height !== EXPECTED_HEIGHT
                    ) {
                        statusMessage = translate("rcc.status.warningDim", {
                            width: dims.width,
                            height: dims.height,
                            expWidth: EXPECTED_WIDTH,
                            expHeight: EXPECTED_HEIGHT,
                        });
                    } else {
                        statusMessage = translate("rcc.status.replaced", {
                            name: updated.name,
                            size: formatSize(updated.size),
                        });
                    }
                } catch {
                    statusMessage = translate("rcc.status.replaced", {
                        name: updated.name,
                        size: formatSize(updated.size),
                    });
                }
            } else {
                statusMessage = translate("rcc.status.replaced", {
                    name: updated.name,
                    size: formatSize(updated.size),
                });
            }

            // Update local state and refresh preview
            rccFiles = await invoke<RccFileInfo[]>(COMMANDS.RCC_GET_FILES);
            await selectResource({ ...updated, source: "rcc" });
        } catch (e) {
            statusMessage = `Replace error: ${e}`;
        }
    }

    async function deleteResource() {
        if (!selectedFile) return;
        const name = selectedFile.name;

        const confirmed = await openConfirmModal(
            translate("rcc.dialog.deleteMsg", { name }) +
                `<div class="confirm-detail"><span class="detail-label">${translate("rcc.preview.path")}</span><span class="detail-value">${selectedFile.path}</span></div>` +
                `<div class="confirm-warning">${translate("rcc.dialog.deleteWarning")}</div>`,
            translate("rcc.dialog.deleteTitle"),
            translate("rcc.btn.delete").replace(/^[^\w]*/, ""),
            translate("modal.btn.cancel"),
        );
        if (!confirmed) return;

        try {
            rccFiles = await invoke<RccFileInfo[]>(
                COMMANDS.RCC_DELETE_RESOURCE,
                {
                    index: selectedFile.index,
                },
            );
            selectedFile = null;
            previewUrl = null;
            statusMessage = translate("rcc.status.deleted", { name });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
        }
    }

    async function addResource() {
        const selected = await open({
            title: translate("rcc.dialog.addTitle"),
            multiple: true,
            filters: [
                {
                    name: "Images",
                    extensions: [
                        "png",
                        "jpg",
                        "jpeg",
                        "bmp",
                        "gif",
                        "svg",
                        "webp",
                        "ico",
                    ],
                },
                { name: "All Files", extensions: ["*"] },
            ],
        });
        if (!selected) return;

        const filePaths = Array.isArray(selected) ? selected : [selected];

        // Ask for target path inside the RCC
        const defaultDir = selectedFile
            ? selectedFile.path.substring(0, selectedFile.path.lastIndexOf("/"))
            : "";
        const targetDir = await openPromptModal({
            title: translate("rcc.prompt.rccPath"),
            defaultValue: defaultDir,
        });
        if (targetDir === null) return; // cancelled

        try {
            let updatedFiles: RccFileInfo[] = [];
            for (const fp of filePaths) {
                const fileName = (fp as string).split(/[\\/]/).pop() || "";
                const rccPath = targetDir
                    ? `${targetDir.replace(/\/$/, "")}/${fileName}`
                    : "";
                updatedFiles = await invoke<RccFileInfo[]>(
                    COMMANDS.RCC_ADD_RESOURCE,
                    {
                        filePath: fp,
                        rccPath,
                    },
                );
            }
            rccFiles = updatedFiles;
            statusMessage = translate("rcc.status.added", {
                count: filePaths.length,
            });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
        }
    }

    async function extractAll() {
        const dir = await save({
            title: translate("rcc.dialog.extractAllTitle"),
            defaultPath: "client_extracted",
        });
        if (!dir) return;

        isLoading = true;
        statusMessage = translate("rcc.status.extracting");
        try {
            // Extract every loaded source into its own subfolder.
            let count = 0;
            if (rccFiles.length > 0) {
                count += await invoke<number>(COMMANDS.RCC_EXTRACT_ALL, {
                    outputDir: `${dir}/rcc`,
                });
            }
            if (exeFiles.length > 0) {
                count += await invoke<number>(COMMANDS.EXE_EXTRACT_ALL, {
                    outputDir: `${dir}/exe`,
                });
            }
            statusMessage = translate("rcc.status.extractedCount", { count });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
        } finally {
            isLoading = false;
        }
    }

    async function extractSingle() {
        if (!selectedFile) return;
        const dest = await save({
            title: translate("rcc.dialog.saveFile", {
                name: selectedFile.name,
            }),
            defaultPath: selectedFile.name,
        });
        if (!dest) return;

        try {
            await invoke(cmdsFor(selectedFile.source).EXTRACT_SINGLE, {
                index: selectedFile.index,
                outputPath: dest,
            });
            statusMessage = translate("rcc.status.saved", {
                path: selectedFile.name,
            });
        } catch (e) {
            statusMessage = `Save error: ${e}`;
        }
    }

    async function saveRcc() {
        const dest = await save({
            title: translate("rcc.dialog.saveTitle"),
            defaultPath: rccPath || "output.rcc",
            filters: [{ name: "Qt Resource", extensions: ["rcc"] }],
        });
        if (!dest) return;

        isLoading = true;
        statusMessage = translate("rcc.status.saving");
        try {
            const saved = await invoke<string>(COMMANDS.RCC_SAVE, {
                outputPath: dest,
            });
            statusMessage = translate("rcc.status.saved", { path: saved });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
        } finally {
            isLoading = false;
        }
    }

    const QT_RCC_CACHE_KEY = "qtRccExePath";

    /** Resolve a usable Qt rcc.exe: cached path → auto-detect → ask the user. */
    async function resolveQtRcc(): Promise<string | null> {
        const cached = localStorage.getItem(QT_RCC_CACHE_KEY);
        if (cached) return cached;
        const detected = await invoke<string | null>(
            COMMANDS.RCC_DETECT_QT_RCC,
        );
        if (detected) {
            localStorage.setItem(QT_RCC_CACHE_KEY, detected);
            return detected;
        }
        // Ask the user to point at rcc.exe (e.g. PySide6/rcc.exe).
        const picked = await open({
            title: translate("rcc.dialog.pickRccExe"),
            filters: [{ name: "rcc", extensions: ["exe"] }],
        });
        if (!picked) return null;
        localStorage.setItem(QT_RCC_CACHE_KEY, picked as string);
        return picked as string;
    }

    /** Recompile the loaded .rcc with Qt's official rcc (preserving compression)
     *  and install it over the client's source .rcc so the game reads the edits.
     *  Backup + atomic write happen on the Rust side. Falls back to the in-house
     *  writer only if no Qt rcc is available (produces a larger, uncompressed
     *  but still valid .rcc). */
    async function installRccToClient() {
        const confirmed = await openConfirmModal(
            translate("rcc.dialog.installRccMsg") +
                `<div class="confirm-warning">${translate("rcc.dialog.installRccWarning")}</div>`,
            translate("rcc.dialog.installRccTitle"),
            translate("rcc.btn.installRcc").replace(/^[^\w]*/, ""),
            translate("modal.btn.cancel"),
        );
        if (!confirmed) return;
        isLoading = true;
        statusMessage = translate("rcc.status.installingRcc");
        try {
            const rccExe = await resolveQtRcc();
            let path: string;
            if (rccExe) {
                path = await invoke<string>(COMMANDS.RCC_INSTALL_TO_CLIENT_QT, {
                    rccExe,
                });
            } else {
                // No Qt rcc — fall back to the uncompressed in-house writer.
                statusMessage = translate("rcc.status.installingRccFallback");
                path = await invoke<string>(COMMANDS.RCC_INSTALL_TO_CLIENT);
            }
            statusMessage = translate("rcc.status.installedRcc", { path });
        } catch (e) {
            // If a cached rcc.exe path went stale, clear it so next try re-detects.
            localStorage.removeItem(QT_RCC_CACHE_KEY);
            statusMessage = `${translate("rcc.status.error", { err: String(e) })}`;
        } finally {
            isLoading = false;
        }
    }

    // ---- generic sprite-grid editing (any .rcc image sheet) --------------

    /** Re-fetch the selected sheet's bytes + grid info after an edit so the
     *  SpriteGrid re-renders without losing the selection. */
    async function refreshGrid() {
        if (!selectedFile) return;
        const data = await invoke<number[]>(COMMANDS.RCC_GET_RESOURCE, {
            index: selectedFile.index,
        });
        gridBytes = new Uint8Array(data);
        gridInfo = await invoke<ImageGridInfo>(COMMANDS.RCC_IMAGE_INFO, {
            index: selectedFile.index,
        });
        rccFiles = await invoke<RccFileInfo[]>(COMMANDS.RCC_GET_FILES);
    }

    /** Add (append) or replace a cell from a PNG file. `at` = null appends. */
    async function gridAddOrReplace(at: number | null) {
        if (!selectedFile || !gridInfo) return;
        const picked = await open({
            title: translate("rcc.dialog.pickIcon"),
            filters: [{ name: "PNG", extensions: ["png"] }],
        });
        if (!picked) return;
        isLoading = true;
        try {
            const written = await invoke<number>(
                COMMANDS.RCC_IMAGE_ADD_OR_REPLACE,
                {
                    index: selectedFile.index,
                    cell: gridCell,
                    iconFile: picked,
                    atIndex: at,
                },
            );
            await refreshGrid();
            gridSelected = written;
            statusMessage = translate("rcc.status.iconAdded", { idx: written });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
        } finally {
            isLoading = false;
        }
    }

    async function gridRemoveSelected() {
        if (!selectedFile || gridSelected < 0) return;
        const idx = gridSelected;
        isLoading = true;
        try {
            await invoke(COMMANDS.RCC_IMAGE_REMOVE, {
                index: selectedFile.index,
                cell: gridCell,
                atIndex: idx,
            });
            await refreshGrid();
            statusMessage = translate("rcc.status.iconRemoved", { idx });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
        } finally {
            isLoading = false;
        }
    }

    async function gridMove(source: number, target: number) {
        if (!selectedFile) return;
        isLoading = true;
        try {
            await invoke(COMMANDS.RCC_IMAGE_MOVE, {
                index: selectedFile.index,
                cell: gridCell,
                sourceIndex: source,
                targetIndex: target,
            });
            await refreshGrid();
            gridSelected = target;
            statusMessage = translate("rcc.status.iconMoved", {
                source,
                target,
            });
        } catch (e) {
            statusMessage = translate("rcc.status.error", { err: String(e) });
        } finally {
            isLoading = false;
        }
    }

    // Save handler for the structured spell editor. Routes the serialized JSON
    // to the right place: exe → embed in place (or disk on overflow); rcc →
    // replace + recompile-install. The panel calls this per file.
    async function saveSpellJson(
        which: "spells.json" | "spells-previews.json",
        content: string,
    ) {
        if (!selectedFile) return;
        const list = selectedFile.source === "exe" ? exeFiles : rccFiles;
        const target = list.find((f) => f.name === which);
        if (!target) throw new Error(`${which} not found in the loaded source`);
        const bytes = Array.from(new TextEncoder().encode(content));

        if (selectedFile.source === "exe") {
            // Update the in-memory copy, then embed in place. On slot overflow
            // fall back to disk mode (unlimited) automatically.
            await invoke(COMMANDS.EXE_REPLACE_RESOURCE, {
                index: target.index,
                data: bytes,
            });
            try {
                await invoke(COMMANDS.EXE_APPLY_RESOURCE, {
                    index: target.index,
                });
            } catch (e) {
                if (String(e).includes("too large")) {
                    await invoke(COMMANDS.EXE_APPLY_SPELL_TO_DISK, {
                        name: which,
                        content,
                    });
                } else {
                    throw e;
                }
            }
            exeFiles = await invoke<RccFileInfo[]>(COMMANDS.EXE_GET_FILES);
        } else {
            await invoke(COMMANDS.RCC_REPLACE_RESOURCE, {
                index: target.index,
                data: bytes,
            });
            await invoke<string>(COMMANDS.RCC_INSTALL_TO_CLIENT_QT, {
                rccExe: localStorage.getItem("qtRccExePath"),
            }).catch(async () => {
                // Fallback to the in-house writer if Qt rcc isn't available.
                await invoke<string>(COMMANDS.RCC_INSTALL_TO_CLIENT);
            });
            rccFiles = await invoke<RccFileInfo[]>(COMMANDS.RCC_GET_FILES);
        }
    }

    function goBack() {
        assetsState.viewMode = "categories";
    }
</script>

<div class="rcc-browser">
    <!-- Toolbar -->
    <div class="rcc-toolbar">
        <button class="modern-back-btn" onclick={goBack}>
            <span>←</span>
            {translate("rcc.back")}
        </button>
        <h2 class="rcc-title">
            {translate("rcc.title")}
            {#if rccFiles.length > 0}
                <span class="source-badge">RCC</span>
            {/if}
            {#if exeFiles.length > 0}
                <span class="source-badge exe">EXE</span>
            {/if}
        </h2>
        <div class="toolbar-actions">
            <button
                class="rcc-btn primary"
                onclick={openRccFile}
                disabled={isLoading}
            >
                {translate("rcc.btn.open")}
            </button>
            <button
                class="rcc-btn primary"
                onclick={openExeFile}
                disabled={isLoading}
            >
                {translate("rcc.btn.openExe")}
            </button>
            {#if hasContent}
                <button
                    class="rcc-btn"
                    onclick={extractAll}
                    disabled={isLoading}
                >
                    {translate("rcc.btn.extractAll")}
                </button>
                {#if rccFiles.length > 0}
                    <button
                        class="rcc-btn primary"
                        onclick={addResource}
                        disabled={isLoading}
                    >
                        {translate("rcc.btn.add")}
                    </button>
                    <button
                        class="rcc-btn accent"
                        onclick={saveRcc}
                        disabled={isLoading}
                    >
                        {translate("rcc.btn.save")}
                    </button>
                    <button
                        class="rcc-btn accent"
                        onclick={installRccToClient}
                        disabled={isLoading}
                        title={translate("rcc.btn.installRccHint")}
                    >
                        {translate("rcc.btn.installRcc")}
                    </button>
                {/if}
            {/if}
        </div>
    </div>

    {#if hasContent}
        <!-- Stats bar -->
        <div class="rcc-stats">
            <span class="stat-item"
                >📄 {totalFiles} {translate("rcc.stats.files")}</span
            >
            <span class="stat-item">💾 {formatSize(totalSize)}</span>
            {#if rccFiles.length > 0}
                <span class="stat-item path-item" title={rccPath}
                    >📦 {rccPath.split(/[\\/]/).pop()} (v{rccVersion})</span
                >
            {/if}
            {#if exeFiles.length > 0}
                <span class="stat-item path-item" title={exePath}
                    >🎯 {exePath.split(/[\\/]/).pop()}</span
                >
            {/if}
            {#if statusMessage}
                <span class="stat-status">{statusMessage}</span>
            {/if}
        </div>

        <!-- Search -->
        <div class="rcc-search">
            <input
                type="text"
                placeholder={translate("rcc.search.placeholder")}
                bind:value={searchQuery}
                class="search-input"
            />
            <span class="search-count"
                >{filteredFiles.length} {translate("rcc.search.results")}</span
            >
        </div>

        <!-- Content area -->
        <div class="rcc-content">
            <!-- File list -->
            <div class="file-list">
                {#each filteredFiles as file (file.source + ":" + file.index)}
                    <button
                        class="file-item"
                        class:selected={selectedFile?.index === file.index &&
                            selectedFile?.source === file.source}
                        onclick={() => selectResource(file)}
                    >
                        <span class="file-icon">{getFileIcon(file.name)}</span>
                        <div class="file-info">
                            <span class="file-name">{file.name}</span>
                            <span class="file-path">{file.path}</span>
                        </div>
                        <span
                            class="src-tag"
                            class:exe={file.source === "exe"}
                            title={file.source === "exe"
                                ? translate("rcc.src.exe")
                                : translate("rcc.src.rcc")}
                            >{file.source === "exe" ? "EXE" : "RCC"}</span
                        >
                        <span class="file-size">{formatSize(file.size)}</span>
                    </button>
                {/each}
            </div>

            <!-- Preview panel -->
            <div class="preview-panel">
                {#if selectedFile}
                    <div class="preview-header">
                        <h3>{selectedFile.name}</h3>
                        <div class="preview-actions">
                            {#if isSpellJsonFile}
                                <button
                                    class="rcc-btn small accent"
                                    onclick={() =>
                                        (spellEditorOpen = !spellEditorOpen)}
                                >
                                    {spellEditorOpen
                                        ? translate("spell.btn.rawJson")
                                        : translate("spell.btn.structured")}
                                </button>
                            {/if}
                            {#if selectedFile.source === "rcc"}
                                <button
                                    class="rcc-btn small primary"
                                    onclick={replaceResource}
                                >
                                    {translate("rcc.btn.replace")}
                                </button>
                            {/if}
                            {#if selectedFile.source === "exe" && canApplyToExe && textContent === null}
                                <button
                                    class="rcc-btn small accent"
                                    onclick={replaceExeResourceFromFile}
                                    disabled={isLoading}
                                    title={translate(
                                        "rcc.btn.replaceApplyHint",
                                    )}
                                >
                                    {translate("rcc.btn.replaceApply")}
                                </button>
                            {/if}
                            <button
                                class="rcc-btn small"
                                onclick={extractSingle}
                            >
                                {translate("rcc.btn.export")}
                            </button>
                            {#if selectedFile.source === "rcc"}
                                <button
                                    class="rcc-btn small danger"
                                    onclick={deleteResource}
                                >
                                    {translate("rcc.btn.delete")}
                                </button>
                            {/if}
                        </div>
                    </div>
                    <div class="preview-meta">
                        <span
                            >{translate("rcc.preview.path")}: {selectedFile.path}</span
                        >
                        <span
                            >{translate("rcc.preview.size")}: {formatSize(
                                selectedFile.size,
                            )}</span
                        >
                        {#if selectedFile.compressed}
                            <span class="badge compressed"
                                >{translate("rcc.preview.compressed")}</span
                            >
                        {/if}
                    </div>
                    <div
                        class="preview-content"
                        class:text-mode={textContent !== null &&
                            !(isSpellJsonFile && spellEditorOpen)}
                        class:hex-mode={hexPreview !== null}
                        class:dmp-mode={dmpInfo !== null}
                        class:grid-mode={isGridSheet}
                        class:panel-mode={isSpellJsonFile && spellEditorOpen}
                    >
                        {#if isSpellJsonFile && spellEditorOpen}
                            <SpellEditorPanel
                                source={selectedFile.source}
                                spellsIndex={spellEditorIndices.spells}
                                previewsIndex={spellEditorIndices.previews}
                                onsave={saveSpellJson}
                                onstatus={(m) => (statusMessage = m)}
                            />
                        {:else if isGridSheet && gridBytes && gridInfo}
                            <div class="grid-view">
                                <div class="grid-toolbar">
                                    <span class="text-ext-badge">GRID</span>
                                    <span class="text-char-count">
                                        {gridInfo.count}
                                        {translate("rcc.grid.cells")} · {gridInfo.cell}px
                                        {#if gridSelected >= 0}
                                            · #{gridSelected}
                                        {/if}
                                    </span>
                                    <label class="grid-zoom">
                                        🔍
                                        <input
                                            type="range"
                                            min="1"
                                            max="6"
                                            step="1"
                                            bind:value={gridZoom}
                                        />
                                    </label>
                                    <button
                                        class="rcc-btn small accent"
                                        onclick={() => gridAddOrReplace(null)}
                                        disabled={isLoading}
                                        title={translate("rcc.grid.appendHint")}
                                    >
                                        {translate("rcc.grid.append")}
                                    </button>
                                    <button
                                        class="rcc-btn small primary"
                                        onclick={() =>
                                            gridAddOrReplace(gridSelected)}
                                        disabled={isLoading || gridSelected < 0}
                                        title={translate("rcc.grid.replaceHint")}
                                    >
                                        {translate("rcc.grid.replace")}
                                    </button>
                                    <button
                                        class="rcc-btn small danger"
                                        onclick={gridRemoveSelected}
                                        disabled={isLoading || gridSelected < 0}
                                    >
                                        {translate("rcc.grid.remove")}
                                    </button>
                                </div>
                                <SpriteGrid
                                    bytes={gridBytes}
                                    cell={gridCell}
                                    bind:selectedIndex={gridSelected}
                                    zoom={gridZoom}
                                    onreorder={gridMove}
                                />
                                <p class="grid-hint">
                                    {translate("rcc.grid.dragHint")}
                                </p>
                            </div>
                        {:else if previewUrl}
                            <img
                                src={previewUrl}
                                alt={selectedFile.name}
                                class="preview-image"
                            />
                        {:else if audioUrl}
                            <div class="audio-preview">
                                <span class="audio-icon">🔊</span>
                                <p class="audio-filename">
                                    {selectedFile.name}
                                </p>
                                <audio
                                    controls
                                    src={audioUrl}
                                    class="audio-player"
                                >
                                    <track kind="captions" />
                                </audio>
                                <p class="audio-meta">
                                    {formatSize(selectedFile.size)} · {getFileExtension(
                                        selectedFile.name,
                                    ).toUpperCase()}
                                </p>
                            </div>
                        {:else if textContent !== null}
                            <div class="text-editor">
                                <div class="text-editor-toolbar">
                                    <span class="text-ext-badge"
                                        >{getFileExtension(
                                            selectedFile.name,
                                        ).toUpperCase()}</span
                                    >
                                    <span class="text-char-count"
                                        >{textContent.length} chars</span
                                    >
                                    {#if textModified}
                                        <button
                                            class="rcc-btn small primary"
                                            onclick={saveTextEdit}
                                        >
                                            {selectedFile.source === "rcc"
                                                ? translate("rcc.btn.saveText")
                                                : matchingRccFile(selectedFile)
                                                  ? translate(
                                                        "rcc.btn.saveToRcc",
                                                    )
                                                  : translate(
                                                        "rcc.btn.saveToDisk",
                                                    )}
                                        </button>
                                        <button
                                            class="rcc-btn small"
                                            onclick={discardTextEdit}
                                        >
                                            ↩ Descartar
                                        </button>
                                    {/if}
                                    {#if selectedFile.source === "exe" && canApplyToExe}
                                        <button
                                            class="rcc-btn small accent"
                                            onclick={applyToClientExe}
                                            disabled={isLoading}
                                            title={translate(
                                                "rcc.btn.applyToClientHint",
                                            )}
                                        >
                                            {translate("rcc.btn.applyToClient")}
                                        </button>
                                    {/if}
                                    {#if selectedFile.source === "exe" && isSpellJson(selectedFile.name)}
                                        <button
                                            class="rcc-btn small"
                                            onclick={applySpellToDisk}
                                            disabled={isLoading}
                                            title={translate(
                                                "rcc.btn.applyDiskHint",
                                            )}
                                        >
                                            {translate("rcc.btn.applyDisk")}
                                        </button>
                                    {/if}
                                </div>
                                <textarea
                                    class="text-content"
                                    bind:value={textContent}
                                    oninput={() => (textModified = true)}
                                    spellcheck={false}
                                ></textarea>
                            </div>
                        {:else if dmpInfo !== null}
                            <div class="dmp-view">
                                <div class="dmp-header-card">
                                    <div class="dmp-card-title">
                                        💾 Tibia Dump File
                                    </div>
                                    <div class="dmp-fields">
                                        <div class="dmp-field">
                                            <span class="dmp-label">Magic</span>
                                            <code class="dmp-value"
                                                >{dmpInfo.magic}</code
                                            >
                                        </div>
                                        <div class="dmp-field">
                                            <span class="dmp-label"
                                                >Version</span
                                            >
                                            <code class="dmp-value"
                                                >{dmpInfo.version}</code
                                            >
                                        </div>
                                        {#if dmpInfo.buildTag}
                                            <div class="dmp-field">
                                                <span class="dmp-label"
                                                    >Build</span
                                                >
                                                <code class="dmp-value accent"
                                                    >{dmpInfo.buildTag}</code
                                                >
                                            </div>
                                        {/if}
                                        <div class="dmp-field">
                                            <span class="dmp-label">Size</span>
                                            <code class="dmp-value"
                                                >{formatSize(
                                                    dmpInfo.fileSize,
                                                )}</code
                                            >
                                        </div>
                                        <div class="dmp-field">
                                            <span class="dmp-label"
                                                >Data offset</span
                                            >
                                            <code class="dmp-value"
                                                >0x{dmpInfo.dataOffset
                                                    .toString(16)
                                                    .toUpperCase()}</code
                                            >
                                        </div>
                                    </div>
                                    {#if dmpInfo.sessionHash}
                                        <div class="dmp-hash-row">
                                            <span class="dmp-label"
                                                >Session ID</span
                                            >
                                            <code class="dmp-hash"
                                                >{dmpInfo.sessionHash}</code
                                            >
                                        </div>
                                    {/if}
                                </div>
                                {#if dmpInfo.entries.length > 0}
                                    <div class="dmp-strings-section">
                                        <div class="dmp-section-title">
                                            Strings extraídas
                                            <span class="dmp-count"
                                                >{dmpInfo.entries.length}</span
                                            >
                                        </div>
                                        <div class="dmp-string-list">
                                            {#each dmpInfo.entries as entry}
                                                <div class="dmp-string-item">
                                                    <span class="dmp-field-tag"
                                                        >f{entry.field}</span
                                                    >
                                                    <span
                                                        class="dmp-string-value"
                                                        >{entry.value}</span
                                                    >
                                                    <span class="dmp-offset"
                                                        >0x{entry.offset.toString(
                                                            16,
                                                        )}</span
                                                    >
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {:else if hexPreview !== null}
                            <div class="hex-preview">
                                <div class="hex-toolbar">
                                    <span class="text-ext-badge"
                                        >{getFileExtension(
                                            selectedFile.name,
                                        ).toUpperCase()}</span
                                    >
                                    <span class="text-char-count"
                                        >{formatSize(selectedFile.size)} · binary</span
                                    >
                                </div>
                                <pre class="hex-content">{hexPreview}</pre>
                            </div>
                        {:else if isImageFile(selectedFile.name)}
                            <p class="preview-loading">
                                {translate("rcc.preview.loading")}
                            </p>
                        {:else}
                            <div class="preview-placeholder">
                                <span class="big-icon"
                                    >{getFileIcon(selectedFile.name)}</span
                                >
                                <p>
                                    {translate("rcc.preview.none", {
                                        ext: getFileExtension(
                                            selectedFile.name,
                                        ),
                                    })}
                                </p>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="preview-placeholder">
                        <span class="big-icon">👆</span>
                        <p>{translate("rcc.preview.select")}</p>
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <!-- Empty state -->
        <div class="rcc-empty">
            <div class="empty-icon">🗂️</div>
            <h3>{translate("rcc.empty.title")}</h3>
            <p>{translate("rcc.empty.desc")}</p>
            <div class="empty-actions">
                <button class="rcc-btn primary large" onclick={openRccFile}>
                    {translate("rcc.empty.btn")}
                </button>
                <button class="rcc-btn primary large" onclick={openExeFile}>
                    {translate("rcc.btn.openExe")}
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .rcc-browser {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--primary-bg);
        color: var(--text-primary);
        font-family: var(--font-family);
    }

    /* Toolbar */
    .rcc-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
    }
    .rcc-title {
        font-size: 16px;
        font-weight: 700;
        margin: 0;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .source-badge {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 2px 7px;
        border-radius: var(--radius-sm);
        background: rgba(99, 102, 241, 0.2);
        color: var(--primary-accent);
    }
    .source-badge.exe {
        background: rgba(245, 158, 11, 0.2);
        color: var(--warning-color);
    }
    .empty-actions {
        display: flex;
        gap: 12px;
    }
    /* Per-row source tag in the file list */
    .src-tag {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 1px 5px;
        border-radius: var(--radius-sm);
        background: rgba(99, 102, 241, 0.18);
        color: var(--primary-accent);
        flex-shrink: 0;
    }
    .src-tag.exe {
        background: rgba(245, 158, 11, 0.18);
        color: var(--warning-color);
    }
    .toolbar-actions {
        display: flex;
        gap: 8px;
    }

    /* Buttons */
    .rcc-btn {
        padding: 6px 14px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--tertiary-bg);
        color: var(--text-primary);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
        white-space: nowrap;
    }
    .rcc-btn:hover:not(:disabled) {
        background: var(--surface-bg);
        border-color: var(--primary-accent);
    }
    .rcc-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .rcc-btn.primary {
        background: var(--gradient-primary);
        border-color: var(--primary-accent);
        color: white;
    }
    .rcc-btn.primary:hover:not(:disabled) {
        filter: brightness(1.15);
    }
    .rcc-btn.accent {
        background: linear-gradient(135deg, #059669, var(--success-color));
        border-color: var(--success-color);
        color: white;
    }
    .rcc-btn.small {
        padding: 4px 10px;
        font-size: 11px;
    }
    .rcc-btn.large {
        padding: 12px 28px;
        font-size: 14px;
    }
    .rcc-btn.danger {
        background: linear-gradient(135deg, #dc2626, var(--error-color));
        border-color: var(--error-color);
        color: white;
    }
    .rcc-btn.danger:hover:not(:disabled) {
        filter: brightness(1.15);
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
    }

    /* Stats bar */
    .rcc-stats {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 6px 16px;
        background: var(--tertiary-bg);
        border-bottom: 1px solid var(--border-color);
        font-size: 12px;
    }
    .stat-item {
        color: var(--text-secondary);
    }
    .path-item {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .stat-status {
        margin-left: auto;
        color: var(--primary-accent);
        font-weight: 500;
    }

    /* Search */
    .rcc-search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-color);
    }
    .search-input {
        flex: 1;
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 13px;
        transition: border-color var(--transition-fast);
    }
    .search-input:focus {
        outline: none;
        border-color: var(--border-focus);
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
    .search-count {
        font-size: 11px;
        color: var(--text-muted);
        white-space: nowrap;
    }

    /* Content split */
    .rcc-content {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    /* File list */
    .file-list {
        width: 420px;
        min-width: 300px;
        overflow-y: auto;
        border-right: 1px solid var(--border-color);
        scrollbar-width: thin;
    }
    .file-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        border: none;
        border-bottom: 1px solid var(--border-soft-20);
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        transition: background var(--transition-fast);
        text-align: left;
    }
    .file-item:hover {
        background: rgba(79, 70, 229, 0.08);
    }
    .file-item.selected {
        background: rgba(79, 70, 229, 0.15);
        border-left: 3px solid var(--primary-accent);
    }
    .file-icon {
        font-size: 18px;
        flex-shrink: 0;
    }
    .file-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }
    .file-name {
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .file-path {
        font-size: 10px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .file-size {
        font-size: 10px;
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    /* Preview panel */
    .preview-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        border-bottom: 1px solid var(--border-color);
    }
    .preview-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
    }
    .preview-actions {
        display: flex;
        gap: 6px;
    }
    .preview-meta {
        display: flex;
        gap: 16px;
        padding: 6px 16px;
        font-size: 11px;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-soft-20);
    }
    .badge.compressed {
        background: rgba(245, 158, 11, 0.2);
        color: var(--warning-color);
        padding: 1px 6px;
        border-radius: var(--radius-sm);
        font-size: 10px;
    }
    .preview-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow: auto;
        background: repeating-conic-gradient(
                rgba(255, 255, 255, 0.03) 0% 25%,
                transparent 0% 50%
            )
            0 0 / 20px 20px;
    }
    .preview-image {
        max-width: 100%;
        max-height: 100%;
        image-rendering: pixelated;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
    }
    .preview-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: var(--text-muted);
    }
    .preview-loading {
        color: var(--text-secondary);
        font-style: italic;
    }
    .big-icon {
        font-size: 48px;
        opacity: 0.5;
    }

    /* Audio preview */
    .audio-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 32px;
    }
    .audio-icon {
        font-size: 56px;
        opacity: 0.8;
    }
    .audio-filename {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }
    .audio-player {
        width: 100%;
        max-width: 400px;
        accent-color: var(--primary-accent);
    }
    .audio-meta {
        font-size: 11px;
        color: var(--text-muted);
        margin: 0;
    }

    /* Text editor */
    .preview-content.text-mode,
    .preview-content.hex-mode,
    .preview-content.grid-mode,
    .preview-content.panel-mode {
        align-items: stretch;
        justify-content: flex-start;
        padding: 0;
        background: none;
    }
    .preview-content.panel-mode {
        display: flex;
        min-height: 0;
    }

    /* Sprite grid view */
    .grid-view {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
    }
    .grid-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--tertiary-bg);
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
        flex-wrap: wrap;
    }
    .grid-zoom {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--text-muted);
    }
    .grid-zoom input {
        width: 80px;
    }
    .grid-hint {
        margin: 0;
        padding: 6px 12px;
        font-size: 11px;
        color: var(--text-muted);
        flex-shrink: 0;
    }
    .text-editor,
    .hex-preview {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
    }
    .text-editor-toolbar,
    .hex-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--tertiary-bg);
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
    }
    .text-ext-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: var(--radius-sm);
        background: rgba(99, 102, 241, 0.2);
        color: var(--primary-accent);
        letter-spacing: 0.5px;
    }
    .text-char-count {
        font-size: 11px;
        color: var(--text-muted);
        flex: 1;
    }
    .text-content {
        flex: 1;
        resize: none;
        border: none;
        outline: none;
        background: var(--primary-bg);
        color: var(--text-primary);
        font-family: "Consolas", "Cascadia Code", monospace;
        font-size: 12px;
        line-height: 1.6;
        padding: 12px 16px;
        overflow: auto;
        scrollbar-width: thin;
    }
    .text-content:focus {
        box-shadow: inset 0 0 0 1px var(--border-focus);
    }

    /* Hex dump */
    .hex-content {
        flex: 1;
        overflow: auto;
        background: var(--primary-bg);
        color: var(--text-secondary);
        font-family: "Consolas", "Cascadia Code", monospace;
        font-size: 11px;
        line-height: 1.7;
        padding: 12px 16px;
        margin: 0;
        scrollbar-width: thin;
        white-space: pre;
    }

    /* DMP viewer */
    .preview-content.dmp-mode {
        align-items: stretch;
        justify-content: flex-start;
        padding: 0;
        background: none;
        overflow-y: auto;
    }
    .dmp-view {
        display: flex;
        flex-direction: column;
        gap: 0;
        flex: 1;
    }
    .dmp-header-card {
        padding: 16px;
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
    }
    .dmp-card-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 12px;
    }
    .dmp-fields {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 20px;
        margin-bottom: 8px;
    }
    .dmp-field {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .dmp-label {
        font-size: 10px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .dmp-value {
        font-size: 12px;
        font-family: "Consolas", monospace;
        color: var(--text-primary);
        background: var(--tertiary-bg);
        padding: 1px 6px;
        border-radius: var(--radius-sm);
    }
    .dmp-value.accent {
        background: rgba(99, 102, 241, 0.2);
        color: var(--primary-accent);
    }
    .dmp-hash-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
    }
    .dmp-hash {
        font-size: 10px;
        font-family: "Consolas", monospace;
        color: var(--text-secondary);
        word-break: break-all;
        background: var(--tertiary-bg);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
    }
    .dmp-strings-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .dmp-section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--border-soft-20);
        background: var(--tertiary-bg);
        flex-shrink: 0;
    }
    .dmp-count {
        background: rgba(99, 102, 241, 0.2);
        color: var(--primary-accent);
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 9999px;
    }
    .dmp-string-list {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .dmp-string-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px 16px;
        border-bottom: 1px solid var(--border-soft-20);
        font-size: 12px;
    }
    .dmp-string-item:hover {
        background: rgba(99, 102, 241, 0.05);
    }
    .dmp-field-tag {
        font-size: 9px;
        font-family: monospace;
        color: var(--text-muted);
        background: var(--tertiary-bg);
        padding: 1px 5px;
        border-radius: var(--radius-sm);
        flex-shrink: 0;
        min-width: 24px;
        text-align: center;
    }
    .dmp-string-value {
        flex: 1;
        color: var(--text-primary);
        font-weight: 500;
    }
    .dmp-offset {
        font-size: 10px;
        font-family: monospace;
        color: var(--text-muted);
        flex-shrink: 0;
    }

    /* Empty state */
    .rcc-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
    }
    .empty-icon {
        font-size: 64px;
        opacity: 0.4;
    }
    .rcc-empty h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
    }
    .rcc-empty p {
        margin: 0;
        color: var(--text-muted);
        font-size: 14px;
    }
</style>
