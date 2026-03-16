/**
 * TotallyNormalImage — Crypto Module
 * AES-256-GCM encryption/decryption using Web Crypto API
 * All operations are client-side for maximum security.
 */

const CryptoModule = (() => {
  "use strict";

  /**
   * Derives an AES-256 key from a password using PBKDF2.
   * @param {string} password - User password
   * @param {Uint8Array} salt - 16-byte salt
   * @returns {Promise<CryptoKey>}
   */
  async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM.
   * Returns a base64-encoded string containing: salt (16) + iv (12) + ciphertext.
   * @param {string} plaintext - Text to encrypt
   * @param {string} password - Encryption password
   * @returns {Promise<string>} Base64-encoded encrypted data
   */
  async function encrypt(plaintext, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(plaintext),
    );

    // Combine: salt + iv + ciphertext
    const combined = new Uint8Array(
      salt.length + iv.length + ciphertext.byteLength,
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypts a base64-encoded AES-256-GCM encrypted string.
   * @param {string} encryptedBase64 - Base64-encoded encrypted data
   * @param {string} password - Decryption password
   * @returns {Promise<string>} Decrypted plaintext
   * @throws {Error} If password is incorrect or data is corrupted
   */
  async function decrypt(encryptedBase64, password) {
    const decoder = new TextDecoder();

    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    // Extract salt, iv, ciphertext
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKey(password, salt);

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext,
      );
      return decoder.decode(decrypted);
    } catch (e) {
      throw new Error(
        "Decryption failed. Incorrect password or corrupted data.",
      );
    }
  }

  return { encrypt, decrypt };
})();
