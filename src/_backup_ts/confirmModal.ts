import { modalOpened, modalClosed } from './modalState';

export function openConfirmModal(message: string, title = 'Confirmar ação'): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal') as HTMLElement | null;
    const msgEl = document.getElementById('confirm-message') as HTMLElement | null;
    const titleEl = document.getElementById('confirm-title') as HTMLElement | null;
    const okBtn = document.getElementById('confirm-ok') as HTMLButtonElement | null;
    const cancelBtn = document.getElementById('confirm-cancel') as HTMLButtonElement | null;
    const closeBtn = document.getElementById('close-confirm') as HTMLButtonElement | null;
    if (!modal || !msgEl || !okBtn || !cancelBtn) {
      // Fallback to native confirm if modal not available
      const ok = window.confirm(message);
      resolve(ok);
      return;
    }

    const mm = modal as HTMLElement;
    const backdrop = mm.querySelector('.modal-backdrop') as HTMLElement | null;

    if (titleEl) titleEl.textContent = title;
    msgEl.textContent = message;

    const cleanup = () => {
      mm.classList.remove('show');
      mm.style.display = 'none';
      document.removeEventListener('keydown', onKeyDown);
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      if (closeBtn) closeBtn.onclick = null;
      if (backdrop) backdrop.onclick = null;
      modalClosed();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      } else if (e.key === 'Tab') {
        // Basic focus trap within modal
        const focusables = Array.from(mm.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
          .filter(el => !el.hasAttribute('disabled'));
        if (focusables.length) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    okBtn.onclick = () => {
      cleanup();
      resolve(true);
    };
    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
    if (closeBtn) closeBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
    if (backdrop) backdrop.onclick = () => {
      cleanup();
      resolve(false);
    };

    // Show modal and focus OK
    mm.style.display = 'flex';
    mm.classList.add('show');
    modalOpened();
    okBtn.focus();
    document.addEventListener('keydown', onKeyDown);
  });
}

export function closeConfirmModal(): void {
  const modal = document.getElementById('confirm-modal') as HTMLElement | null;
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}
