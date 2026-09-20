// Best-effort malware check: looks up the file's SHA-256 hash against
// VirusTotal's database of previously-analyzed files. This does NOT upload
// or scan the file itself (that requires a paid tier and takes minutes) —
// it only tells us whether this exact file has already been flagged by
// security vendors elsewhere. A hash VirusTotal has never seen returns
// "unscanned", not "clean" — we never claim a file is safe without evidence.

export interface ScanResult {
  status: "unscanned" | "clean" | "suspicious" | "malicious" | "error";
  positives: number | null;
  total: number | null;
  link: string | null;
}

export async function checkHashWithVirusTotal(sha256: string): Promise<ScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { status: "error", positives: null, total: null, link: null };
  }

  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
      headers: { "x-apikey": apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      // VirusTotal has never seen this exact file before.
      return { status: "unscanned", positives: null, total: null, link: null };
    }
    if (!res.ok) {
      return { status: "error", positives: null, total: null, link: null };
    }

    const json = await res.json();
    const stats = json?.data?.attributes?.last_analysis_stats;
    if (!stats) {
      return { status: "unscanned", positives: null, total: null, link: null };
    }

    const malicious = stats.malicious ?? 0;
    const suspicious = stats.suspicious ?? 0;
    const total =
      (stats.malicious ?? 0) +
      (stats.suspicious ?? 0) +
      (stats.undetected ?? 0) +
      (stats.harmless ?? 0);
    const positives = malicious + suspicious;

    const link = `https://www.virustotal.com/gui/file/${sha256}`;

    if (malicious >= 3) {
      return { status: "malicious", positives, total, link };
    }
    if (positives > 0) {
      return { status: "suspicious", positives, total, link };
    }
    return { status: "clean", positives: 0, total, link };
  } catch {
    return { status: "error", positives: null, total: null, link: null };
  }
}
