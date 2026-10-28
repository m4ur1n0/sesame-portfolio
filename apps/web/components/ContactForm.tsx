"use client";

import { useActionState, useEffect } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitInquiry, type ContactState } from "@/app/(public)/contact/actions";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

interface Props {
  turnstileSiteKey: string;
  artwork?: { slug: string; title: string };
}

export function ContactForm({ turnstileSiteKey, artwork }: Props) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitInquiry, {
    status: "idle",
  });

  // a Turnstile token is single-use, so a failed submit needs a fresh one
  useEffect(() => {
    if (state.status === "error") window.turnstile?.reset();
  }, [state]);

  const values = state.status === "error" ? state.values : undefined;

  if (state.status === "sent") {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <p className="text-emerald-800 font-medium">Message sent.</p>
        <p className="mt-1 text-sm text-emerald-700">
          Thank you — I&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      {artwork && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-muted)]">
          Inquiring about:{" "}
          <span className="text-[var(--color-text)] font-medium">{artwork.title}</span>
          <input type="hidden" name="artwork" value={artwork.slug} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={200}
            autoComplete="name"
            defaultValue={values?.name}
            placeholder="Your name"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            defaultValue={values?.email}
            placeholder="your@email.com"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">
          Subject{" "}
          <span className="text-[var(--color-subtle)] font-normal">(optional)</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          maxLength={200}
          defaultValue={values?.subject ?? (artwork ? `Inquiry: ${artwork.title}` : undefined)}
          placeholder="Purchase inquiry, commission, general question…"
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={5}
          defaultValue={values?.message}
          placeholder="Write your message here…"
          disabled={pending}
          className="resize-none"
        />
      </div>

      <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
