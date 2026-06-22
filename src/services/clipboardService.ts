import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { translate } from "../i18n";
import { showStatus } from "../utils";

/** Copies arbitrary text to the OS clipboard with user feedback. */
export async function copyText(text: string): Promise<void> {
  try {
    await writeText(text);
    showStatus(translate("status.copied"), "success");
  } catch (err) {
    console.error("Clipboard write failed", err);
    showStatus(translate("status.copyFailed"), "error");
  }
}

/** `<look type=".." head="0" .../>` template for an outfit (colors default to 0). */
export function buildOutfitXml(id: number): string {
  return `<look type="${id}" head="0" body="0" legs="0" feet="0" addons="0" mount="0"/>`;
}

/** `<item id=".."/>` template for an object. */
export function buildItemXml(id: number): string {
  return `<item id="${id}"/>`;
}
