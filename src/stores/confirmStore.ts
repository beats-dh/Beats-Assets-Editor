import { writable } from 'svelte/store';

export interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const confirmState = writable<ConfirmOptions | null>(null);

export function confirm(options: ConfirmOptions) {
  confirmState.set(options);
}

export function closeConfirm() {
  confirmState.set(null);
}
