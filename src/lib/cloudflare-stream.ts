const STREAM_API = 'https://api.cloudflare.com/client/v4/accounts';

export type StreamUploadResult = {
  uid: string;
  hlsUrl: string;
  thumbnailUrl: string;
};

export async function uploadToStream(buffer: Buffer, contentType: string): Promise<StreamUploadResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

  const fd = new FormData();
  fd.set('file', new Blob([new Uint8Array(buffer)], { type: contentType }), 'upload');
  fd.set('requireSignedURLs', 'false');
  fd.set('allowDownloads', 'true');
  fd.set('maxDurationSeconds', '300');

  const res = await fetch(`${STREAM_API}/${accountId}/stream`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CF Stream upload failed: ${res.status} ${text}`);
  }

  const json = await res.json() as { result: { uid: string } };
  const uid = json.result.uid;

  return {
    uid,
    hlsUrl: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
    thumbnailUrl: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
  };
}

export async function deleteFromStream(uid: string): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN!;
  await fetch(`${STREAM_API}/${accountId}/stream/${uid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function streamUidFromUrl(url: string): string | null {
  const m = url.match(/videodelivery\.net\/([a-f0-9]{32,})\//);
  return m ? m[1] : null;
}
