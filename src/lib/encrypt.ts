/**
 * Web Crypto implementation of NotePal encryption logic.
 * Compatible with both Browser and Cloudflare Workers.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Derives a CryptoKey from a password and salt using PBKDF2.
 */
export async function deriveMasterKey({
  password,
  salt,
}: {
  password: string;
  salt: Uint8Array;
}): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
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
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts content using AES-GCM and a note-specific key.
 * The note key itself is encrypted with the master key.
 */
export async function createEncryptedNote({
  content,
  masterKey,
}: {
  content: string;
  masterKey: CryptoKey;
}): Promise<{ encryptedContent: string; encryptedKey: string; iv: string }> {
  // 1. Generate a random 256-bit note key
  const noteKeyRaw = crypto.getRandomValues(new Uint8Array(32));
  const noteKey = await crypto.subtle.importKey(
    "raw",
    noteKeyRaw,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );

  // 2. Encrypt content with the note key
  const contentIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedContentBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: contentIv },
    noteKey,
    encoder.encode(content),
  );

  // 3. Encrypt the note key with the master key
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: keyIv },
    masterKey,
    noteKeyRaw,
  );

  // 4. Return everything as base64 strings
  // We combine the IV with the encrypted data for the key to match original logic or keep it separate
  // The original wrapNoteKey combined them: [iv, encrypted, authTag]
  // Web Crypto AES-GCM already includes the auth tag at the end of the buffer.
  const combinedKeyBuffer = new Uint8Array(
    keyIv.length + encryptedKeyBuffer.byteLength,
  );
  combinedKeyBuffer.set(keyIv);
  combinedKeyBuffer.set(new Uint8Array(encryptedKeyBuffer), keyIv.length);

  return {
    encryptedContent: arrayBufferToBase64(encryptedContentBuffer),
    encryptedKey: arrayBufferToBase64(combinedKeyBuffer),
    iv: arrayBufferToBase64(contentIv),
  };
}

/**
 * Decrypts a note using its encrypted key, IV, and the master key.
 */
export async function decryptNote(
  encryptedContent: string,
  encryptedKey: string,
  iv: string,
  masterKey: CryptoKey,
): Promise<string> {
  const combinedKeyBuffer = base64ToArrayBuffer(encryptedKey);
  const contentIv = base64ToArrayBuffer(iv);
  const encryptedContentBuffer = base64ToArrayBuffer(encryptedContent);

  // 1. Unwrap the note key
  const keyIv = combinedKeyBuffer.slice(0, 12);
  const encryptedKeyData = combinedKeyBuffer.slice(12);

  const noteKeyRawBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: keyIv },
    masterKey,
    encryptedKeyData,
  );

  const noteKey = await crypto.subtle.importKey(
    "raw",
    noteKeyRawBuffer,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );

  // 2. Decrypt content with the note key
  const decryptedContentBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: contentIv },
    noteKey,
    encryptedContentBuffer,
  );

  return decoder.decode(decryptedContentBuffer);
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Utility functions for Base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
