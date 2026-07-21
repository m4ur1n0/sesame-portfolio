import type {
  Artwork,
  Post,
  Media,
  ContactSubmission,
  ArtworkAvailability,
  ContentType,
  PostStatus,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export function isApiConfigured(): boolean {
  return Boolean(API_BASE && !API_BASE.includes("example-worker"));
}

export function mediaUrl(key: string): string {
  if (!API_BASE) return "";
  return `${API_BASE}/media/${key}`;
}

// ——— generic fetch helpers ———

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  adminToken?: string,
): Promise<T> {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  const headers: Record<string, string> = {
    ...(init?.body && typeof init.body === "string"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, adminToken?: string): Promise<T> {
  return apiFetch<T>(path, undefined, adminToken);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  adminToken?: string,
): Promise<T> {
  return apiFetch<T>(
    path,
    { method: "POST", body: JSON.stringify(body) },
    adminToken,
  );
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  adminToken?: string,
): Promise<T> {
  return apiFetch<T>(
    path,
    { method: "PUT", body: JSON.stringify(body) },
    adminToken,
  );
}

export async function apiDelete<T>(
  path: string,
  adminToken?: string,
): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" }, adminToken);
}

export async function apiUpload(
  file: File,
  adminToken?: string,
): Promise<{ id: string; key: string; url: string }> {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  const form = new FormData();
  form.append("file", file);

  const headers: Record<string, string> = adminToken
    ? { Authorization: `Bearer ${adminToken}` }
    : {};

  const res = await fetch(`${API_BASE}/media`, {
    method: "POST",
    body: form,
    headers,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

// ——— public artwork API ———

export async function getArtworks(): Promise<Artwork[]> {
  if (!isApiConfigured()) return [];
  try {
    const data = await apiGet<{ artworks: Artwork[] }>("/artworks");
    return data.artworks;
  } catch {
    return [];
  }
}

export async function getFeaturedArtworks(): Promise<Artwork[]> {
  if (!isApiConfigured()) return [];
  try {
    const data = await apiGet<{ artworks: Artwork[] }>("/artworks/featured");
    return data.artworks;
  } catch {
    return [];
  }
}

export async function getArtworkBySlug(slug: string): Promise<Artwork | null> {
  if (!isApiConfigured()) return null;
  try {
    const data = await apiGet<{ artwork: Artwork }>(`/artworks/${slug}`);
    return data.artwork;
  } catch {
    return null;
  }
}

export async function getPurchaseArtworks(): Promise<Artwork[]> {
  if (!isApiConfigured()) return [];
  try {
    const data = await apiGet<{ artworks: Artwork[] }>("/artworks/purchase");
    return data.artworks;
  } catch {
    return [];
  }
}

// ——— contact ———

export async function submitContact(
  submission: ContactSubmission,
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/contact", submission);
}

// ——— admin artwork API ———

export async function adminGetArtworks(
  token: string,
): Promise<Artwork[]> {
  const data = await apiGet<{ artworks: Artwork[] }>(
    "/admin/artworks",
    token,
  );
  return data.artworks;
}

export async function adminGetArtwork(
  id: string,
  token: string,
): Promise<Artwork> {
  const data = await apiGet<{ artwork: Artwork }>(
    `/admin/artworks/${id}`,
    token,
  );
  return data.artwork;
}

export interface ArtworkPayload {
  title: string;
  slug: string;
  content_type: ContentType;
  excerpt?: string;
  body_html?: string;
  year?: string;
  medium?: string;
  dimensions?: string;
  price?: string;
  availability: ArtworkAvailability;
  gallery_visible: boolean;
  purchase_visible: boolean;
  display_order: number;
  featured: boolean;
  hero_media_id?: string;
  additional_media_ids?: string[];
  artist_notes?: string;
  purchase_instructions?: string;
  status: PostStatus;
}

export async function adminCreateArtwork(
  payload: ArtworkPayload,
  token: string,
): Promise<{ id: string }> {
  return apiPost<{ id: string }>("/admin/artworks", payload, token);
}

export async function adminUpdateArtwork(
  id: string,
  payload: Partial<ArtworkPayload>,
  token: string,
): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/admin/artworks/${id}`, payload, token);
}

export async function adminDeleteArtwork(
  id: string,
  token: string,
): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/admin/artworks/${id}`, token);
}

export async function adminPublishArtwork(
  id: string,
  token: string,
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(
    `/admin/artworks/${id}/publish`,
    {},
    token,
  );
}

export async function adminUnpublishArtwork(
  id: string,
  token: string,
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(
    `/admin/artworks/${id}/unpublish`,
    {},
    token,
  );
}

export async function adminVerify(token: string): Promise<boolean> {
  try {
    await apiGet("/admin/verify", token);
    return true;
  } catch {
    return false;
  }
}

// keep the old app/lib/api path working for now — nothing imports it but good hygiene
export type { Artwork, Post, Media, ContactSubmission };
