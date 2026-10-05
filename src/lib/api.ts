export async function api(url: string, body?: unknown, method = "POST") {
  const r = await fetch("/api/" + url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error((await r.json()).error);
  return r;
}
