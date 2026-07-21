"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminVerify } from "@/lib/api";
import { SITE } from "@/lib/site";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");

    const ok = await adminVerify(password);
    if (ok) {
      sessionStorage.setItem("admin_token", password);
      router.replace("/admin");
    } else {
      setState("error");
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1
          className="text-2xl text-[var(--color-text)] mb-8 text-center"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {SITE.name} — Admin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={state === "loading"}
            />
          </div>

          {state === "error" && (
            <p role="alert" className="text-sm text-red-600">
              Incorrect password.
            </p>
          )}

          <Button type="submit" disabled={state === "loading"} className="w-full">
            {state === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
