import { writable } from 'svelte/store';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Internal callbacks
  resolve?: (value: boolean) => void;
}

export const confirmState = writable<ConfirmOptions | null>(null);

// Legacy callback style (optional wrapper if needed, but we prefer Promise)
export function confirm(options: ConfirmOptions & { onConfirm: () => void, onCancel?: () => void }) {
  confirmState.set({
    ...options,
    resolve: (result) => {
      if (result) options.onConfirm();
      else if (options.onCancel) options.onCancel();
    }
  });
}

// Promise style
export function openConfirmModal(message: string, title = 'Confirmar', confirmLabel = 'Sim', cancelLabel = 'Não'): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.set({
      title,
      message,
      confirmLabel,
      cancelLabel,
      resolve
    });
  });
}

export function closeConfirm(result: boolean) {
  confirmState.update(state => {
    if (state?.resolve) {
      state.resolve(result);
    }
    return null;
  });
}
