import { put, list, del } from "@vercel/blob";

const hasBlobConfig = () => {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
};

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
  if (!hasBlobConfig()) return false;
  try {
    const timestamp = Date.now();
    const filename = `state/${stateName}-${timestamp}.json`;
    
    const putPromise = put(filename, JSON.stringify(data), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    const result = await withTimeout(putPromise, 3000, null);
    if (!result) return false;

    // Asynchronously delete older state versions in the background without awaiting
    list({ prefix: `state/${stateName}-` })
      .then((existing) => {
        const oldBlobs = existing.blobs.filter((b) => b.pathname !== filename);
        if (oldBlobs.length > 0) {
          del(oldBlobs.map((b) => b.url)).catch(() => {});
        }
      })
      .catch(() => {});

    return true;
  } catch (err) {
    console.error(`[BlobStorage] Error writing state ${stateName}:`, err);
    return false;
  }
}

export async function readBlobState<T>(stateName: string, fallback: T): Promise<T> {
  if (!hasBlobConfig()) return fallback;
  try {
    const readOperation = async (): Promise<T> => {
      const existing = await list({ prefix: `state/${stateName}-` });
      if (!existing.blobs || existing.blobs.length === 0) {
        return fallback;
      }

      // Sort to get the most recent version
      const latest = existing.blobs.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0];

      const res = await fetch(latest.url, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const parsed = await res.json();
        return parsed as T;
      }
      return fallback;
    };

    return await withTimeout(readOperation(), 2500, fallback);
  } catch (err) {
    console.error(`[BlobStorage] Error reading state ${stateName}:`, err);
    return fallback;
  }
}

export async function uploadImageToBlob(
  buffer: Buffer,
  contentType: string,
  extension: string = "jpg"
): Promise<string | null> {
  if (!hasBlobConfig()) return null;
  try {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const filename = `dishes/${Date.now()}-${randomSuffix}.${extension}`;
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: contentType || "image/jpeg",
    });
    return blob.url;
  } catch (err) {
    console.error("[BlobStorage] Error uploading image:", err);
    return null;
  }
}
