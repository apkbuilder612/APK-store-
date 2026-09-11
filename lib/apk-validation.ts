import { createHash } from "crypto";

// A .apk is a ZIP file. Real APKs start with the ZIP local-file-header magic
// (PK\x03\x04) — or, rarely, the empty-archive marker (PK\x05\x06). Renaming
// an arbitrary file to ".apk" will NOT pass this check.
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
const ZIP_EMPTY_MAGIC = [0x50, 0x4b, 0x05, 0x06];

export function looksLikeApk(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  const head = [buffer[0], buffer[1], buffer[2], buffer[3]];
  const matches = (magic: number[]) => magic.every((b, i) => head[i] === b);
  return matches(ZIP_MAGIC) || matches(ZIP_EMPTY_MAGIC);
}

// A real APK also contains AndroidManifest.xml as a zip entry. We do a cheap
// scan for the literal entry name in the central directory / local headers
// rather than pulling in a full zip parser dependency.
export function containsAndroidManifest(buffer: Buffer): boolean {
  return buffer.includes(Buffer.from("AndroidManifest.xml"));
}

export function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export interface ApkValidationResult {
  valid: boolean;
  reason?: string;
  sizeBytes: number;
  sha256: string;
}

export function validateApkBuffer(buffer: Buffer): ApkValidationResult {
  const sizeBytes = buffer.length;
  const sha256 = sha256Hex(buffer);

  if (!looksLikeApk(buffer)) {
    return { valid: false, reason: "File is not a valid ZIP/APK archive.", sizeBytes, sha256 };
  }
  if (!containsAndroidManifest(buffer)) {
    return { valid: false, reason: "File does not contain AndroidManifest.xml.", sizeBytes, sha256 };
  }
  return { valid: true, sizeBytes, sha256 };
}
