type UploadBody =
  | string
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | ReadableStream<Uint8Array>
  | Buffer;

export async function uploadToBunny(filePath: string, body: UploadBody) {
  const url = `https://ny.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${filePath}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: process.env.BUNNY_STORAGE_ZONE_KEY!,
      "Content-Type": "application/octet-stream",
      accept: "application/json",
    },
    // Cast for TS compatibility across Node/DOM BodyInit differences
    body: body as any,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload file: ${response.status} ${response.statusText}`
    );
  }

  return response;
}
