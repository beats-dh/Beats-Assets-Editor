// Prompt modal state (replaces the native webview prompt()). Promise-based,
// mirroring confirmState/openConfirmModal.

export interface PromptOptions {
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    resolve?: (value: string | null) => void;
}

export const promptState = $state({
    options: null as PromptOptions | null,
});

export function openPromptModal(opts: {
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}): Promise<string | null> {
    return new Promise((resolve) => {
        promptState.options = { ...opts, resolve };
    });
}

export function closePrompt(value: string | null) {
    const opts = promptState.options;
    if (opts?.resolve) {
        opts.resolve(value);
    }
    promptState.options = null;
}
