/**
 * UUID Generation Utility
 *
 * Provides a cross-browser compatible UUID v4 generator that works in both
 * secure (HTTPS) and non-secure (HTTP) contexts.
 *
 * crypto.randomUUID() is only available in secure contexts (HTTPS or localhost).
 * When accessed via HTTP on a LAN IP (e.g., http://192.168.1.100:3000),
 * the native method is not available, so we provide a fallback.
 */

/**
 * Generate a UUID v4 string
 * Uses crypto.randomUUID() when available, falls back to manual generation
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID first (only available in secure contexts)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: Generate UUID v4 using crypto.getRandomValues (works in all contexts)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant (RFC4122) bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC4122

    // Convert to hex string with dashes
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort fallback using Math.random (less secure but works everywhere)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Export as default for convenience
export default generateUUID;
