// Confirm modal state using Svelte 5 runes

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    resolve?: (value: boolean) => void;
}

export const confirmState = $state({
    options: null as ConfirmOptions | null,
});

// Legacy callback style
export function confirm(opts: ConfirmOptions & { onConfirm: () => void; onCancel?: () => void }) {
    confirmState.options = {
        ...opts,
        resolve: (result) => {
            if (result) opts.onConfirm();
            else if (opts.onCancel) opts.onCancel();
        },
    };
}

// Promise style
export function openConfirmModal(
    message: string,
    title = 'Confirmar',
    confirmLabel = 'Sim',
    cancelLabel = 'Não'
): Promise<boolean> {
    return new Promise((resolve) => {
        confirmState.options = { title, message, confirmLabel, cancelLabel, resolve };
    });
}

export function closeConfirm(result: boolean) {
    const opts = confirmState.options;
    if (opts?.resolve) {
        opts.resolve(result);
    }
    confirmState.options = null;
}
