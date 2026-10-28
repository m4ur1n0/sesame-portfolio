import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./db";

const COOKIE = "admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// cookie value: `${expiresAtMs}.${hmac(expiresAtMs)}` — rotating SESSION_SECRET logs everyone out
export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, mac] = value.split(".");
  if (!mac || !(Number(expires) > Date.now())) return false;
  return safeEqual(mac, sign(expires, env().SESSION_SECRET));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function login(password: string): Promise<"ok" | "invalid" | "locked"> {
  const { DB, ADMIN_PASSWORD, SESSION_SECRET } = env();
  const ip = (await headers()).get("cf-connecting-ip") ?? "unknown";
  const now = Date.now();

  const recent = await DB.prepare(
    "SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND attempted_at > ?",
  )
    .bind(ip, now - LOCKOUT_WINDOW_MS)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= MAX_FAILURES) return "locked";

  // compare HMACs so the check is constant-time regardless of password length
  const ok =
    Boolean(ADMIN_PASSWORD && SESSION_SECRET) &&
    safeEqual(sign(password, SESSION_SECRET), sign(ADMIN_PASSWORD, SESSION_SECRET));

  if (!ok) {
    await DB.batch([
      DB.prepare("INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)").bind(ip, now),
      DB.prepare("DELETE FROM login_attempts WHERE attempted_at < ?").bind(now - LOCKOUT_WINDOW_MS),
    ]);
    return "invalid";
  }

  await DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
  const expires = String(now + SESSION_SECONDS * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires, SESSION_SECRET)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return "ok";
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
