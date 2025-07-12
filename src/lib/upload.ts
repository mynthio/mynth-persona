export async function uploadToBunny(filePath: string, body: BodyInit) {
  const url = `https://ny.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${filePath}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: process.env.BUNNY_STORAGE_ZONE_KEY!,
      "Content-Type": "application/octet-stream",
      accept: "application/json",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload file: ${response.status} ${response.statusText}`
    );
  }

  return response;
}
