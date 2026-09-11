export interface PwaUrlValidation {
  valid: boolean;
  reason?: string;
  normalized?: string;
}

export function validatePwaUrl(input: string): PwaUrlValidation {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { valid: false, reason: "Enter a valid URL, e.g. https://example.com" };
  }

  if (url.hostname.toLowerCase().endsWith(".onion")) {
    return { valid: false, reason: ".onion URLs are not supported." };
  }

  if (url.protocol !== "https:") {
    return { valid: false, reason: "URL must use HTTPS." };
  }

  return { valid: true, normalized: url.toString() };
}
