const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";

const INTERNAL_SHARED_SECRET = process.env.INTERNAL_SHARED_SECRET ?? "";

export async function postToFastApi<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SHARED_SECRET,
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`FastAPI request failed: ${response.status} ${message}`);
  }

  return (await response.json()) as T;
}
