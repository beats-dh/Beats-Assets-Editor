import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "../utils/invoke";
import { COMMANDS } from "../commands";
import { translate } from "../i18n";
import { showStatus } from "../utils";

/**
 * Exports a canvas (the composed outfit/object preview) as a PNG file. The bytes
 * are produced in the webview via `toBlob` and written to disk by the backend
 * (the webview has no direct filesystem access).
 */
export async function exportCanvasAsPng(
  canvas: HTMLCanvasElement,
  defaultName: string,
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) {
    showStatus(translate("status.imageExportFailed"), "error");
    return;
  }

  const dest = await save({
    defaultPath: defaultName,
    filters: [{ name: "PNG", extensions: ["png"] }],
  });
  if (!dest) return;

  try {
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    await invoke(COMMANDS.SAVE_IMAGE_BYTES, { path: dest, bytes });
    showStatus(translate("status.imageExported"), "success");
  } catch (err) {
    console.error("Failed to export image", err);
    showStatus(translate("status.imageExportFailed"), "error");
  }
}

/** Saves raw bytes (e.g. an encoded GIF) via the save dialog + backend writer. */
export async function saveBytesToFile(
  bytes: Uint8Array,
  defaultName: string,
  filterName: string,
  ext: string,
): Promise<void> {
  const dest = await save({
    defaultPath: defaultName,
    filters: [{ name: filterName, extensions: [ext] }],
  });
  if (!dest) return;
  try {
    await invoke(COMMANDS.SAVE_IMAGE_BYTES, { path: dest, bytes: Array.from(bytes) });
    showStatus(translate("status.imageExported"), "success");
  } catch (err) {
    console.error("Failed to save file", err);
    showStatus(translate("status.imageExportFailed"), "error");
  }
}
