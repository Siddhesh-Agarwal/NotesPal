import {
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  randomBytes,
} from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

/**
 * Derives a master encryption key from a user's password using PBKDF2
 * Store the salt per-user (not in this example, but you'll need it)
 */
export async function deriveMasterKey(
  password: string,
  salt: Buffer,
): Promise<Buffer> {
  return pbkdf2Async(password, salt, 100000, 32, "sha256");
}

/**
 * Generates a random 256-bit encryption key for a single note
 */
function generateNoteKey(): Buffer {
  return randomBytes(32); // 256 bits
}

/**
 * Encrypts note content with a note-specific key
 * Returns: { encryptedContent: base64, iv: base64 }
 */
export function encryptNoteContent(
  content: string,
  noteKey: Buffer,
): { encryptedContent: string; iv: string } {
  const iv = randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = createCipheriv("aes-256-gcm", noteKey, iv);

  let encrypted = cipher.update(content, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine encrypted data with auth tag
  const combined = Buffer.concat([
    Buffer.from(encrypted, "base64"),
    authTag,
  ]).toString("base64");

  return {
    encryptedContent: combined,
    iv: iv.toString("base64"),
  };
}

/**
 * Decrypts note content using the note-specific key
 */
function decryptNoteContent(
  encryptedContent: string,
  iv: string,
  noteKey: Buffer,
): string {
  const combined = Buffer.from(encryptedContent, "base64");

  // Extract auth tag (last 16 bytes) and encrypted data
  const authTag = Uint8Array.prototype.slice.call(combined, -16);
  const encrypted = Uint8Array.prototype.slice.call(combined, 0, -16);

  const decipher = createDecipheriv(
    "aes-256-gcm",
    noteKey,
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypts the note key with the master key (key wrapping)
 * Returns base64-encoded encrypted key
 */
function wrapNoteKey(noteKey: Buffer, masterKey: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);

  let encrypted = cipher.update(noteKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted key + auth tag
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return combined.toString("base64");
}

/**
 * Decrypts the note key using the master key (key unwrapping)
 */
function unwrapNoteKey(wrappedKey: string, masterKey: Buffer): Buffer {
  const combined = Buffer.from(wrappedKey, "base64");

  // Extract IV (first 12 bytes), auth tag (last 16 bytes), and encrypted key
  const iv = Uint8Array.prototype.slice.call(combined, 0, 12);
  const authTag = Uint8Array.prototype.slice.call(combined, -16);
  const encryptedKey = Uint8Array.prototype.slice.call(combined, 12, -16);

  const decipher = createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedKey);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}

/**
 * Complete flow: Create an encrypted note
 */
export function createEncryptedNote(
  content: string,
  masterKey: Buffer,
): { encryptedContent: string; encryptedKey: string; iv: string } {
  const noteKey = generateNoteKey();
  const { encryptedContent, iv } = encryptNoteContent(content, noteKey);
  const encryptedKey = wrapNoteKey(noteKey, masterKey);

  return {
    encryptedContent,
    encryptedKey,
    iv,
  };
}

/**
 * Complete flow: Decrypt and read a note
 */
export function decryptNote(
  encryptedContent: string,
  encryptedKey: string,
  iv: string,
  masterKey: Buffer,
): string {
  const noteKey = unwrapNoteKey(encryptedKey, masterKey);
  return decryptNoteContent(encryptedContent, iv, noteKey);
}

/**
 * Generate a random salt for PBKDF2 (call once per user, store it)
 */
export function generateSalt() {
  return randomBytes(16).toString("hex");
}
