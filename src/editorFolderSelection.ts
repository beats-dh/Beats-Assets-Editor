import { open } from "@tauri-apps/plugin-dialog";

export interface FolderSelectionViewOptions {
  onBack: () => void;
  title: string;
  description: string;
  storageKey: string;
  loadButtonLabel: string;
  helpText: string;
  emptyStateText: string;
  resultHeading: string;
  folderTitle?: string;
  folderLabel?: string;
  placeholder?: string;
  browseButtonLabel?: string;
  scanningText?: string;
  readyText?: string;
}

function createHeader(title: string, description: string): HTMLElement {
  const header = document.createElement("div");
  header.className = "editor-header";

  const body = document.createElement("div");
  const heading = document.createElement("h2");
  heading.textContent = title;
  const subtitle = document.createElement("p");
  subtitle.className = "editor-description";
  subtitle.textContent = description;
  body.append(heading, subtitle);

  header.append(body);
  return header;
}

function createFolderInput(
  storageKey: string,
  {
    folderTitle,
    folderLabel,
    placeholder,
    browseButtonLabel,
  }: Pick<FolderSelectionViewOptions, "folderTitle" | "folderLabel" | "placeholder" | "browseButtonLabel">
): {
  fieldset: HTMLElement;
  input: HTMLInputElement;
  loadButton: HTMLButtonElement;
  browseButton: HTMLButtonElement;
  status: HTMLParagraphElement;
  results: HTMLElement;
} {
  const fieldset = document.createElement("div");
  fieldset.className = "launcher-folder-card";

  const title = document.createElement("h3");
  title.className = "launcher-folder-title";
  title.textContent = folderTitle ?? "Select a scripts directory";

  const inputGroup = document.createElement("div");
  inputGroup.className = "input-group";

  const label = document.createElement("label");
  label.textContent = folderLabel ?? "Scripts folder";

  const inputRow = document.createElement("div");
  inputRow.className = "input-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "modern-input";
  input.placeholder = placeholder ?? "C:\\Path\\To\\scripts";
  input.autocomplete = "off";
  input.value = localStorage.getItem(storageKey) ?? "";

  const browseButton = document.createElement("button");
  browseButton.type = "button";
  browseButton.className = "btn-secondary";
  browseButton.textContent = browseButtonLabel ?? "Selecionar diretório";

  inputRow.append(input, browseButton);
  label.append(inputRow);
  inputGroup.append(label);

  const loadButton = document.createElement("button");
  loadButton.type = "button";
  loadButton.className = "btn-primary launcher-folder-load";
  loadButton.innerHTML = '<span class="btn-icon">📁</span><span>Load scripts</span>';
  loadButton.disabled = !input.value.trim();

  const status = document.createElement("p");
  status.className = "launcher-secondary-text";
  status.textContent = "";
  status.hidden = true;

  const results = document.createElement("div");
  results.className = "launcher-folder-results";
  results.hidden = true;

  fieldset.append(title, inputGroup, loadButton, status, results);

  input.addEventListener("input", () => {
    const value = input.value.trim();
    loadButton.disabled = !value;
    if (value) {
      localStorage.setItem(storageKey, value);
    } else {
      localStorage.removeItem(storageKey);
    }
  });

  browseButton.addEventListener("click", async () => {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === "string" && selection) {
        input.value = selection;
        localStorage.setItem(storageKey, selection);
        loadButton.disabled = false;
      }
    } catch (error) {
      console.error("Failed to open directory chooser:", error);
    }
  });

  return { fieldset, input, loadButton, browseButton, status, results };
}

export function createFolderSelectionView(options: FolderSelectionViewOptions): HTMLElement {
  const container = document.createElement("div");
  container.className = "editor-view launcher-folder-view";

  container.append(
    createHeader(options.title, options.description)
  );

  const card = document.createElement("div");
  card.className = "setup-card";

  const helper = document.createElement("p");
  helper.className = "launcher-secondary-text";
  helper.textContent = options.helpText;

  const { fieldset, input, loadButton, status, results } = createFolderInput(options.storageKey, options);

  const loadLabel = options.loadButtonLabel || "Load scripts";
  loadButton.innerHTML = `<span class="btn-icon">📁</span><span>${loadLabel}</span>`;

  card.append(helper, fieldset);

  loadButton.addEventListener("click", async () => {
    const path = input.value.trim();
    if (!path) {
      status.hidden = false;
      status.textContent = options.emptyStateText;
      results.hidden = true;
      results.innerHTML = "";
      return;
    }

    loadButton.disabled = true;
    loadButton.dataset.loading = "true";
    status.hidden = false;
    status.textContent = options.scanningText ?? "Scanning directory for scripts...";
    results.innerHTML = "";

    const heading = document.createElement("h4");
    heading.textContent = options.resultHeading;
    const ready = document.createElement("p");
    ready.className = "launcher-secondary-text";
    ready.textContent = options.readyText ?? 'Scripts are ready to be processed. Integration with the editor will arrive soon.';

    results.append(heading, ready);
    results.hidden = false;
    status.textContent = `Loaded scripts from ${path}`;

    loadButton.disabled = false;
    delete loadButton.dataset.loading;
  });

  container.append(card);

  return container;
}
