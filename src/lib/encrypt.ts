import {
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  randomBytes,
} from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

export async function deriveMasterKey(
  password: string,
  salt: Buffer,
): Promise<Buffer> {
  return pbkdf2Async(password, salt, 100000, 32, "sha256");
}

function generateNoteKey(): Buffer {
  return randomBytes(32);
}

export function encryptNoteContent(
  content: string,
  noteKey: Buffer,
): { encryptedContent: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", noteKey, iv);

  let encrypted = cipher.update(content, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([
    Buffer.from(encrypted, "base64"),
    authTag,
  ]).toString("base64");

  return {
    encryptedContent: combined,
    iv: iv.toString("base64"),
  };
}

function decryptNoteContent(
  encryptedContent: string,
  iv: string,
  noteKey: Buffer,
): string {
  const combined = Buffer.from(encryptedContent, "base64");

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

function wrapNoteKey(noteKey: Buffer, masterKey: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);

  let encrypted = cipher.update(noteKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString("base64");
}

function unwrapNoteKey(wrappedKey: string, masterKey: Buffer): Buffer {
  const combined = Buffer.from(wrappedKey, "base64");

  const iv = Uint8Array.prototype.slice.call(combined, 0, 12);
  const authTag = Uint8Array.prototype.slice.call(combined, -16);
  const encryptedKey = Uint8Array.prototype.slice.call(combined, 12, -16);

  const decipher = createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedKey);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}

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

export function decryptNote(
  encryptedContent: string,
  encryptedKey: string,
  iv: string,
  masterKey: Buffer,
): string {
  const noteKey = unwrapNoteKey(encryptedKey, masterKey);
  return decryptNoteContent(encryptedContent, iv, noteKey);
}

export function generateSalt() {
  return randomBytes(16).toString("hex");
}
