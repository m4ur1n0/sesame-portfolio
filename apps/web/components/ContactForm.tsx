"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContact } from "@/lib/api";

interface Props {
  artworkRef?: string;
  artworkTitle?: string;
}

export function ContactForm({ artworkRef, artworkTitle }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setError("");

    const fd = new FormData(e.currentTarget);
    try {
      await submitContact({
        name: (fd.get("name") as string).trim(),
        email: (fd.get("email") as string).trim(),
        subject: (fd.get("subject") as string | null)?.trim() || undefined,
        message: (fd.get("message") as string).trim(),
        artwork_ref: artworkRef,
      });
      setState("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setState("error");
    }
  }

  if (state === "success") {
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
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {artworkTitle && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-muted)]">
          Inquiring about:{" "}
          <span className="text-[var(--color-text)] font-medium">{artworkTitle}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
            disabled={state === "loading"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="your@email.com"
            disabled={state === "loading"}
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
          placeholder="Purchase inquiry, commission, general question…"
          disabled={state === "loading"}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Write your message here…"
          disabled={state === "loading"}
          className="resize-none"
        />
      </div>

      {state === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={state === "loading"}
        className="w-full sm:w-auto"
      >
        {state === "loading" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
