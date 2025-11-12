import {
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  randomBytes,
} from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

export async function deriveMasterKey({
  password,
  salt,
}: {
  password: string;
  salt: Buffer;
}): Promise<Buffer> {
  return pbkdf2Async(password, salt, 100000, 32, "sha256");
}

function generateNoteKey(): Buffer {
  return randomBytes(32);
}

export function encryptNoteContent({
  content,
  noteKey,
}: {
  content: string;
  noteKey: Buffer;
}): { encryptedContent: string; iv: string } {
  console.log("[start] encryptNoteContent");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", noteKey, iv);

  let encrypted = cipher.update(content, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([encrypted, authTag]).toString("base64");
  console.log("[end  ] encryptNoteContent");

  return {
    encryptedContent: combined,
    iv: iv.toString("base64"),
  };
}

function decryptNoteContent({
  encryptedContent,
  iv,
  noteKey,
}: {
  encryptedContent: string;
  iv: string;
  noteKey: Buffer;
}): string {
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

function wrapNoteKey({
  noteKey,
  masterKey,
}: {
  noteKey: Buffer;
  masterKey: Buffer;
}): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);

  let encrypted = cipher.update(noteKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString("base64");
}

function unwrapNoteKey({
  wrappedKey,
  masterKey,
}: {
  wrappedKey: string;
  masterKey: Buffer;
}): Buffer {
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

export function createEncryptedNote({
  content,
  masterKey,
}: {
  content: string;
  masterKey: Buffer;
}): { encryptedContent: string; encryptedKey: string; iv: string } {
  console.log("[start] createEncryptedNote");
  const noteKey = generateNoteKey();
  console.log("Notekey:", noteKey);
  const { encryptedContent, iv } = encryptNoteContent({ content, noteKey });
  console.log("Encrypted Note Content:");
  console.log(encryptedContent);
  console.log(iv);
  const encryptedKey = wrapNoteKey({ noteKey, masterKey });
  console.log("[end  ] createEncryptedNote");

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
  const noteKey = unwrapNoteKey({ wrappedKey: encryptedKey, masterKey });
  return decryptNoteContent({ encryptedContent, iv, noteKey });
}

export function generateSalt() {
  return randomBytes(16).toString("hex");
}
