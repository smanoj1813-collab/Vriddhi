// src/shared/utils/clipboard.ts

/**
 * Copies text to the system clipboard with a legacy fallback.
 *
 * `navigator.clipboard` only exists in secure contexts, so a deployment
 * served over plain http would otherwise throw "Cannot read properties of
 * undefined (reading 'writeText')" the moment a user hit Copy.
 *
 * @returns true when the text was placed on the clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the execCommand path below.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
