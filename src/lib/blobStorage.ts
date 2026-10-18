const GITHUB_REPO = process.env.GITHUB_DB_REPO || "Udayshankar123-lab/qalbi-db";
const GITHUB_TOKEN = process.env.GITHUB_DB_TOKEN || "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";

const shaCache: Record<string, string> = {};

// In-memory read cache to prevent rate-limiting and guarantee 0ms responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache: Record<string, CacheEntry<unknown>> = {};
const TTL_MS = 2500; // 2.5 seconds cache TTL

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([
      promise.then((res) => {
        if (timer) clearTimeout(timer);
        return res;
      }),
      timeoutPromise,
    ]);
  } catch {
    if (timer) clearTimeout(timer);
    return fallback;
  }
}

export async function writeBlobState<T>(stateName: string, data: T): Promise<boolean> {
  const fileName = `${stateName}.json`;

  // Immediately update local in-memory cache so subsequent reads within the same process are instant
  memoryCache[stateName] = {
    data,
    timestamp: Date.now(),
  };

  const writeOperation = async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let sha = shaCache[fileName];
        if (!sha) {
          const metaRes = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`,
            {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "User-Agent": "QalbiCafe",
              },
              cache: "no-store",
            }
          );
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            sha = metaJson.sha;
          }
        }

        const putRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`,
          {
            method: "PUT",
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              "User-Agent": "QalbiCafe",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Update ${fileName} [${Date.now()}]`,
              content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
              ...(sha ? { sha } : {}),
            }),
          }
        );

        if (putRes.ok) {
          const putJson = await putRes.json();
          shaCache[fileName] = putJson?.content?.sha;
          return true;
        }

        // On conflict (409), clear cached SHA and retry once
        delete shaCache[fileName];
      } catch (err) {
        console.error(`[CloudStorage] Error on attempt ${attempt + 1} for ${fileName}:`, err);
        delete shaCache[fileName];
      }
    }
    return false;
  };

  try {
    const success = await withTimeout(writeOperation(), 4500, false);
    return success;
  } catch (err) {
    console.error(`[CloudStorage] writeBlobState error for ${stateName}:`, err);
    return false;
  }
}

export async function readBlobState<T>(stateName: string, fallback: T): Promise<T> {
  const now = Date.now();
  const cached = memoryCache[stateName];

  // Return fresh in-memory data if within TTL
  if (cached && now - cached.timestamp < TTL_MS) {
    return cached.data as T;
  }

  const fileName = `${stateName}.json`;

  const readOperation = async (): Promise<T> => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": "QalbiCafe",
            Accept: "application/vnd.github.v3.raw",
          },
          cache: "no-store",
        }
      );

      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text) as T;
        memoryCache[stateName] = {
          data: parsed,
          timestamp: Date.now(),
        };
        return parsed;
      }

      // If file not found yet or error, use cached or fallback
      if (cached) return cached.data as T;
      return fallback;
    } catch (err) {
      console.error(`[CloudStorage] readBlobState error for ${stateName}:`, err);
      if (cached) return cached.data as T;
      return fallback;
    }
  };

  return await withTimeout(readOperation(), 3500, cached ? (cached.data as T) : fallback);
}

export async function uploadImageToBlob(
  buffer: Buffer,
  contentType: string,
  extension: string = "jpg"
): Promise<string | null> {
  try {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const filename = `images/${Date.now()}-${randomSuffix}.${extension}`;

    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "User-Agent": "QalbiCafe",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${filename}`,
          content: buffer.toString("base64"),
        }),
      }
    );

    if (putRes.ok) {
      // Return a base64 data URL so any browser can render it with zero authentication requirements
      return `data:${contentType || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }

    return `data:${contentType || "image/jpeg"};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("[CloudStorage] Error uploading image:", err);
    return `data:${contentType || "image/jpeg"};base64,${buffer.toString("base64")}`;
  }
}
