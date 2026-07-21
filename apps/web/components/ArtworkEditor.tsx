"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiUpload, mediaUrl } from "@/lib/api";
import type { ArtworkPayload } from "@/lib/api";
import type { Artwork, ArtworkAvailability } from "@/lib/types";

interface Props {
  initial?: Partial<Artwork>;
  onSave: (payload: ArtworkPayload) => Promise<void>;
  saving: boolean;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function ArtworkEditor({ initial, onSave, saving }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [year, setYear] = useState(initial?.year ?? "");
  const [medium, setMedium] = useState(initial?.medium ?? "");
  const [dimensions, setDimensions] = useState(initial?.dimensions ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [availability, setAvailability] = useState<ArtworkAvailability>(
    initial?.availability ?? "available",
  );
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [artistNotes, setArtistNotes] = useState(initial?.artist_notes ?? "");
  const [purchaseInstructions, setPurchaseInstructions] = useState(
    initial?.purchase_instructions ?? "",
  );
  const [galleryVisible, setGalleryVisible] = useState(
    initial?.gallery_visible !== 0,
  );
  const [purchaseVisible, setPurchaseVisible] = useState(
    initial?.purchase_visible !== 0,
  );
  const [featured, setFeatured] = useState(initial?.featured === 1);
  const [displayOrder, setDisplayOrder] = useState(
    String(initial?.display_order ?? 0),
  );
  const [status, setStatus] = useState<"draft" | "published">(
    initial?.status ?? "draft",
  );

  // image state
  const [heroMediaId, setHeroMediaId] = useState(initial?.hero_media_id ?? "");
  const [additionalIds, setAdditionalIds] = useState<string[]>(() => {
    if (!initial?.additional_media_ids) return [];
    try { return JSON.parse(initial.additional_media_ids) as string[]; } catch { return []; }
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [error, setError] = useState("");

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugTouched) setSlug(slugify(val));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, role: "hero" | "additional") {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = sessionStorage.getItem("admin_token") ?? "";
    setUploading(true);
    setUploadError("");
    try {
      const result = await apiUpload(file, token);
      if (role === "hero") {
        setHeroMediaId(result.id);
      } else {
        setAdditionalIds((prev) => [...prev, result.id]);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    try {
      await onSave({
        title: title.trim(),
        slug: slug.trim(),
        content_type: "artwork",
        excerpt: excerpt.trim() || undefined,
        year: year.trim() || undefined,
        medium: medium.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        price: price.trim() || undefined,
        availability,
        gallery_visible: galleryVisible,
        purchase_visible: purchaseVisible,
        featured,
        display_order: Number(displayOrder) || 0,
        hero_media_id: heroMediaId || undefined,
        additional_media_ids: additionalIds,
        artist_notes: artistNotes.trim() || undefined,
        purchase_instructions: purchaseInstructions.trim() || undefined,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* basic info */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wide">
          Basic Info
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            required
            disabled={saving}
            className="font-mono text-sm"
          />
          <p className="text-xs text-[var(--color-muted)]">Used in the URL: /gallery/{slug || "slug"}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Short Description</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            disabled={saving}
            className="resize-none"
            placeholder="Brief description shown in cards and detail page…"
          />
        </div>
      </section>

      {/* artwork metadata */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wide">
          Artwork Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} disabled={saving} placeholder="2024" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medium">Medium</Label>
            <Input id="medium" value={medium} onChange={(e) => setMedium(e.target.value)} disabled={saving} placeholder="Oil on canvas" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input id="dimensions" value={dimensions} onChange={(e) => setDimensions(e.target.value)} disabled={saving} placeholder='24" × 36"' />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Price</Label>
            <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} disabled={saving} placeholder="$2,400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Availability</Label>
          <Select
            value={availability}
            onValueChange={(v) => setAvailability(v as ArtworkAvailability)}
            disabled={saving}
          >
            <SelectTrigger id="availability">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="inquire">Inquire</SelectItem>
              <SelectItem value="not_for_sale">Not for Sale</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* images */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wide">
          Images
        </h2>

        {/* hero image */}
        <div className="space-y-2">
          <Label>Primary Image</Label>
          {heroMediaId && (
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(heroMediaId)}
                alt="Primary artwork image"
                className="w-24 h-24 object-cover rounded border border-[var(--color-border)]"
              />
              <button
                type="button"
                onClick={() => setHeroMediaId("")}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading || saving}
            onChange={(e) => handleFileUpload(e, "hero")}
            className="text-sm text-[var(--color-muted)]"
          />
        </div>

        {/* additional images */}
        <div className="space-y-2">
          <Label>Additional Images</Label>
          {additionalIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {additionalIds.map((id, i) => (
                <div key={id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(id)}
                    alt={`Additional image ${i + 1}`}
                    className="w-16 h-16 object-cover rounded border border-[var(--color-border)]"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() =>
                      setAdditionalIds((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-[var(--color-border)] rounded-full text-xs text-red-500 flex items-center justify-center hover:bg-red-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading || saving}
            onChange={(e) => handleFileUpload(e, "additional")}
            className="text-sm text-[var(--color-muted)]"
          />
        </div>

        {uploading && <p className="text-sm text-[var(--color-muted)]">Uploading…</p>}
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      </section>

      {/* notes */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wide">
          Notes
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="artistNotes">Artist Notes</Label>
          <Textarea
            id="artistNotes"
            value={artistNotes}
            onChange={(e) => setArtistNotes(e.target.value)}
            rows={3}
            disabled={saving}
            className="resize-none"
            placeholder="Process notes, inspiration, context…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="purchaseInstructions">Purchase Instructions</Label>
          <Textarea
            id="purchaseInstructions"
            value={purchaseInstructions}
            onChange={(e) => setPurchaseInstructions(e.target.value)}
            rows={2}
            disabled={saving}
            className="resize-none"
            placeholder="Shown on the purchase page for this work…"
          />
        </div>
      </section>

      {/* visibility */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wide">
          Visibility & Ordering
        </h2>
        <div className="space-y-2">
          {[
            { id: "galleryVisible", label: "Show in Gallery", checked: galleryVisible, onChange: setGalleryVisible },
            { id: "purchaseVisible", label: "Show on Purchase page", checked: purchaseVisible, onChange: setPurchaseVisible },
            { id: "featured", label: "Featured on home page", checked: featured, onChange: setFeatured },
          ].map(({ id, label, checked, onChange }) => (
            <label key={id} className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer">
              <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={saving}
                className="rounded border-[var(--color-border)]"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="space-y-1.5 max-w-[120px]">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            disabled={saving}
            min={0}
          />
          <p className="text-xs text-[var(--color-muted)]">Lower = shown first</p>
        </div>
      </section>

      {/* status */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wide">
          Status
        </h2>
        <div className="flex gap-4">
          {(["draft", "published"] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                disabled={saving}
              />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </label>
          ))}
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Artwork"}
      </Button>
    </form>
  );
}
