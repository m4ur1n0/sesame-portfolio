"use server";

import { headers } from "next/headers";
import { env } from "@/lib/db";

type Values = { name: string; email: string; subject: string; message: string };

// errors echo the submitted values because React resets the form after every action
export type ContactState =
  | { status: "idle" | "sent" }
  | { status: "error"; error: string; values: Values };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(form: FormData, name: string, max: number) {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

async function verifyTurnstile(token: string) {
  const ip = (await headers()).get("cf-connecting-ip") ?? "";
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env().TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

export async function submitInquiry(_prev: ContactState, form: FormData): Promise<ContactState> {
  const name = field(form, "name", 200);
  const email = field(form, "email", 320).toLowerCase();
  const subject = field(form, "subject", 200);
  const message = field(form, "message", 5000);
  const artworkSlug = field(form, "artwork", 120);
  const fail = (error: string): ContactState => ({
    status: "error",
    error,
    values: { name, email, subject, message },
  });

  if (!name || !email || !message) return fail("Name, email and message are required.");
  if (!EMAIL.test(email)) return fail("Please enter a valid email address.");

  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!token || !(await verifyTurnstile(token))) {
    return fail("Spam check failed. Please try again.");
  }

  await env()
    .DB.prepare(
      `INSERT INTO inquiries (id, name, email, subject, message, artwork_slug)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), name, email, subject || null, message, artworkSlug || null)
    .run();

  return { status: "sent" };
}
