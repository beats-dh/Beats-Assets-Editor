let openCount = 0;

function getBody(): HTMLElement | null {
  return document.body || document.querySelector('body');
}

export function modalOpened(): void {
  openCount += 1;
  const body = getBody();
  body?.classList.add('modal-open');
}

export function modalClosed(): void {
  openCount = Math.max(0, openCount - 1);
  if (openCount === 0) {
    const body = getBody();
    body?.classList.remove('modal-open');
  }
}
