<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { COMMANDS } from "../../commands";
    import { assetsState } from "../../stores/assetsState.svelte";
    import { appState } from "../../stores/appState.svelte";
    import { openConfirmModal } from "../../stores/confirmState.svelte";
    import { open, save } from "@tauri-apps/plugin-dialog";
    import { onMount } from "svelte";
    import { translate } from "../../i18n";

    const RCC_CACHE_KEY = "lastRccPath";

    interface RccFileInfo {
        index: number;
        name: string;
        path: string;
        size: number;
        compressed: boolean;
    }

    interface RccLoadResult {
        files: RccFileInfo[];
        total_files: number;
        total_size: number;
        version: number;
    }

    let files = $state<RccFileInfo[]>([]);
    let filteredFiles = $state<RccFileInfo[]>([]);
    let selectedFile = $state<RccFileInfo | null>(null);
    let previewUrl = $state<string | null>(null);
    let searchQuery = $state("");
    let loadedPath = $state("");
    let totalFiles = $state(0);
    let totalSize = $state(0);
    let rccVersion = $state(0);
    let isLoading = $state(false);
    let statusMessage = $state("");

    // Filter files when search changes
    $effect(() => {
        const q = searchQuery.toLowerCase();
        filteredFiles = q
            ? files.filter(
                  (f) =>
                      f.name.toLowerCase().includes(q) ||
                      f.path.toLowerCase().includes(q),
              )
            : files;
    });

    // Auto-load RCC on mount
    onMount(async () => {
        // Try cached path first
        const cachedPath = localStorage.getItem(RCC_CACHE_KEY);
        if (cachedPath) {
            try {
                await loadRccFile(cachedPath);
                return;
            } catch {
                localStorage.removeItem(RCC_CACHE_KEY);
            }
        }

        // Try to find .rcc from the Tibia client path
        if (appState.tibiaPath) {
            try {
                const found = await invoke<string[]>(COMMANDS.RCC_FIND_FILES, {
                    basePath: appState.tibiaPath,
                });
                if (found.length > 0) {
                    await loadRccFile(found[0]);
                }
            } catch {
                // Silent — user can still open manually
            }
        }
    });

    async function loadRccFile(path: string) {
        isLoading = true;
        statusMessage = translate("rcc.status.loading");
        try {
            const result = await invoke<RccLoadResult>(COMMANDS.RCC_LOAD, {
                path,
            });
            files = result.files;
            totalFiles = result.total_files;
            totalSize = result.total_size;
            rccVersion = result.version;
            loadedPath = path;
            selectedFile = null;
            previewUrl = null;
            localStorage.setItem(RCC_CACHE_KEY, path);
            statusMessage = translate("rcc.status.loaded", {
                count: totalFiles,
                size: formatSize(totalSize),
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
            case "qml":
                return "📄";
            case "qm":
                return "🌐";
            case "js":
                return "⚡";
            case "json":
                return "📋";
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
            await loadRccFile(selected as string);
        } catch {
            // Error already shown via statusMessage
        }
    }

    async function selectResource(file: RccFileInfo) {
        selectedFile = file;
        previewUrl = null;

        if (isImageFile(file.name)) {
            try {
                const data = await invoke<number[]>(COMMANDS.RCC_GET_RESOURCE, {
                    index: file.index,
                });
                const bytes = new Uint8Array(data);
                const blob = new Blob([bytes], {
                    type: `image/${getFileExtension(file.name)}`,
                });
                previewUrl = URL.createObjectURL(blob);
            } catch (e) {
                console.error("Failed to load preview:", e);
            }
        }
    }

    /** Load image dimensions from a Uint8Array */
    function getImageDimensions(
        data: Uint8Array,
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
        const selected = await open({
            title: translate("rcc.dialog.replaceTitle", {
                name: selectedFile.name,
            }),
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
                { name: `Original (${ext})`, extensions: ext ? [ext] : ["*"] },
                { name: "All Files", extensions: ["*"] },
            ],
        });
        if (!selected) return;

        try {
            // Do the replacement
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

            // Update local state
            selectedFile = updated;
            const idx = files.findIndex((f) => f.index === updated.index);
            if (idx >= 0) files[idx] = updated;
            // Refresh preview
            await selectResource(updated);
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
            const updatedFiles = await invoke<RccFileInfo[]>(
                COMMANDS.RCC_DELETE_RESOURCE,
                {
                    index: selectedFile.index,
                },
            );
            files = updatedFiles;
            totalFiles = updatedFiles.length;
            totalSize = updatedFiles.reduce((sum, f) => sum + f.size, 0);
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
        const targetDir = prompt(translate("rcc.prompt.rccPath"), defaultDir);
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
            files = updatedFiles;
            totalFiles = updatedFiles.length;
            totalSize = updatedFiles.reduce((sum, f) => sum + f.size, 0);
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
            defaultPath: "rcc_extracted",
        });
        if (!dir) return;

        isLoading = true;
        statusMessage = translate("rcc.status.extracting");
        try {
            // Use dialog to pick folder
            const count = await invoke<number>(COMMANDS.RCC_EXTRACT_ALL, {
                outputDir: dir,
            });
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
            await invoke(COMMANDS.RCC_EXTRACT_SINGLE, {
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
            defaultPath: loadedPath || "output.rcc",
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
        <h2 class="rcc-title">{translate("rcc.title")}</h2>
        <div class="toolbar-actions">
            <button
                class="rcc-btn primary"
                onclick={openRccFile}
                disabled={isLoading}
            >
                {translate("rcc.btn.open")}
            </button>
            {#if files.length > 0}
                <button
                    class="rcc-btn"
                    onclick={extractAll}
                    disabled={isLoading}
                >
                    {translate("rcc.btn.extractAll")}
                </button>
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
            {/if}
        </div>
    </div>

    {#if loadedPath}
        <!-- Stats bar -->
        <div class="rcc-stats">
            <span class="stat-item"
                >📄 {totalFiles} {translate("rcc.stats.files")}</span
            >
            <span class="stat-item">💾 {formatSize(totalSize)}</span>
            <span class="stat-item">🏷️ v{rccVersion}</span>
            <span class="stat-item path-item" title={loadedPath}
                >📁 {loadedPath.split(/[\\/]/).pop()}</span
            >
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
                {#each filteredFiles as file (file.index)}
                    <button
                        class="file-item"
                        class:selected={selectedFile?.index === file.index}
                        onclick={() => selectResource(file)}
                    >
                        <span class="file-icon">{getFileIcon(file.name)}</span>
                        <div class="file-info">
                            <span class="file-name">{file.name}</span>
                            <span class="file-path">{file.path}</span>
                        </div>
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
                            <button
                                class="rcc-btn small primary"
                                onclick={replaceResource}
                            >
                                {translate("rcc.btn.replace")}
                            </button>
                            <button
                                class="rcc-btn small"
                                onclick={extractSingle}
                            >
                                {translate("rcc.btn.export")}
                            </button>
                            <button
                                class="rcc-btn small danger"
                                onclick={deleteResource}
                            >
                                {translate("rcc.btn.delete")}
                            </button>
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
                    <div class="preview-content">
                        {#if previewUrl}
                            <img
                                src={previewUrl}
                                alt={selectedFile.name}
                                class="preview-image"
                            />
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
            <button class="rcc-btn primary large" onclick={openRccFile}>
                {translate("rcc.empty.btn")}
            </button>
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
