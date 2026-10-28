"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labels } from "@/components/AvailabilityBadge";
import { saveArtwork, type ArtworkInput } from "@/app/admin/actions";
import { mediaUrl } from "@/lib/media";
import { prepareImage, type PreparedImage } from "@/lib/resize";
import { AVAILABILITY, type Artwork, type ArtworkImage, type Availability } from "@/lib/types";

// an image is either already in storage or resized locally and waiting for Save
interface ImageItem {
  key: string;
  alt: string;
  preview: string;
  saved?: ArtworkImage;
  pending?: PreparedImage;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function upload(img: PreparedImage): Promise<ArtworkImage> {
  const form = new FormData();
  form.append("thumb", img.thumb);
  form.append("large", img.large);
  const res = await fetch("/admin/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Image upload failed (${res.status}).`);
  const { id, ext } = (await res.json()) as { id: string; ext: "webp" | "jpg" };
  return { id, ext, w: img.w, h: img.h, alt: "" };
}

export function ArtworkEditor({ initial }: { initial?: Artwork }) {
  const [fields, setFields] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    year: initial?.year ?? "",
    medium: initial?.medium ?? "",
    dimensions: initial?.dimensions ?? "",
    price: initial?.price ?? "",
    description: initial?.description ?? "",
    artist_notes: initial?.artist_notes ?? "",
    purchase_instructions: initial?.purchase_instructions ?? "",
  });
  const [availability, setAvailability] = useState<Availability>(
    initial?.availability ?? "available",
  );
  const [published, setPublished] = useState(initial?.published ?? false);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [images, setImages] = useState<ImageItem[]>(
    () =>
      initial?.images.map((img) => ({
        key: img.id,
        alt: img.alt,
        preview: mediaUrl(img, "thumb"),
        saved: img,
      })) ?? [],
  );
  const [preparing, setPreparing] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, startSaving] = useTransition();

  const busy = saving || preparing > 0;

  function set(name: keyof typeof fields, value: string) {
    setFields((f) => ({
      ...f,
      [name]: value,
      ...(name === "title" && !slugTouched ? { slug: slugify(value) } : {}),
    }));
    setMessage("");
  }

  async function addFiles(files: FileList) {
    setError("");
    for (const file of Array.from(files)) {
      setPreparing((n) => n + 1);
      try {
        const prepared = await prepareImage(file);
        setImages((list) => [
          ...list,
          {
            key: crypto.randomUUID(),
            alt: "",
            preview: URL.createObjectURL(prepared.thumb),
            pending: prepared,
          },
        ]);
      } catch {
        setError(`Couldn't read "${file.name}". Try a JPEG or PNG.`);
      } finally {
        setPreparing((n) => n - 1);
      }
    }
  }

  function moveImage(from: number, to: number) {
    setImages((list) => {
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  function removeImage(index: number) {
    setImages((list) => {
      const item = list[index];
      if (item.pending) URL.revokeObjectURL(item.preview);
      return list.filter((_, i) => i !== index);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    startSaving(async () => {
      try {
        // upload pending images first; already-uploaded ones are kept so a retry doesn't re-send them
        const ready = [...images];
        for (const [i, item] of ready.entries()) {
          if (!item.pending) continue;
          ready[i] = { ...item, saved: await upload(item.pending), pending: undefined };
          setImages([...ready]);
        }

        const input: ArtworkInput = {
          ...fields,
          availability,
          published,
          featured,
          images: ready.map((item) => ({ ...item.saved!, alt: item.alt.trim() })),
        };
        const result = await saveArtwork(initial?.id ?? null, input);
        if ("error" in result) setError(result.error);
        else setMessage(published ? "Saved — live on the site." : "Saved as draft.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  const sectionTitle = "text-sm font-medium text-[var(--color-muted)] uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <h2 className={sectionTitle}>Basic Info</h2>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={fields.title}
            onChange={(e) => set("title", e.target.value)}
            required
            maxLength={200}
            disabled={saving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Web address *</Label>
          <Input
            id="slug"
            value={fields.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase());
            }}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and single hyphens"
            disabled={saving}
            className="font-mono text-sm"
          />
          <p className="text-xs text-[var(--color-muted)]">
            /gallery/{fields.slug || "…"}
            {initial && " — changing this breaks links people have already shared."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={fields.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            maxLength={5000}
            disabled={saving}
            className="resize-y"
            placeholder="Shown on the artwork page and in link previews…"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>Artwork Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              ["year", "Year", "2024"],
              ["medium", "Medium", "Oil on canvas"],
              ["dimensions", "Dimensions", '24" × 36"'],
              ["price", "Price", "$2,400"],
            ] as const
          ).map(([name, label, placeholder]) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                value={fields[name]}
                onChange={(e) => set(name, e.target.value)}
                disabled={saving}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Availability</Label>
          <Select
            value={availability}
            onValueChange={(v) => setAvailability(v as Availability)}
            disabled={saving}
          >
            <SelectTrigger id="availability">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY.map((a) => (
                <SelectItem key={a} value={a}>
                  {labels[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-[var(--color-muted)]">
            Available and Inquire appear for sale on the Purchase page; Reserved and Sold appear
            there as previous works; Not for Sale is gallery-only.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>Images</h2>
        {images.length > 0 && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((item, i) => (
              <li key={item.key} className="space-y-1.5">
                <div className="relative aspect-square rounded border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-raised)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt="" className="w-full h-full object-contain" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] uppercase tracking-wide bg-white/90 px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                  {item.pending && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
                      Uploads on save
                    </span>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1">
                    {[
                      { label: "Move earlier", icon: <ChevronLeft size={14} />, disabled: i === 0, run: () => moveImage(i, i - 1) },
                      { label: "Move later", icon: <ChevronRight size={14} />, disabled: i === images.length - 1, run: () => moveImage(i, i + 1) },
                      { label: "Remove image", icon: <X size={14} />, disabled: false, run: () => removeImage(i) },
                    ].map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        aria-label={b.label}
                        onClick={b.run}
                        disabled={b.disabled || saving}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white/90 border border-[var(--color-border)] disabled:opacity-30"
                      >
                        {b.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  aria-label={`Alt text for image ${i + 1}`}
                  placeholder="Describe the image (for screen readers)"
                  value={item.alt}
                  maxLength={300}
                  disabled={saving}
                  onChange={(e) =>
                    setImages((list) =>
                      list.map((it, j) => (j === i ? { ...it, alt: e.target.value } : it)),
                    )
                  }
                  className="text-xs h-8"
                />
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-1">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!busy) addFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded border-2 border-dashed px-4 py-8 text-sm text-center transition-colors focus-within:ring-2 focus-within:ring-[var(--color-border)] ${
              busy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            } ${
              dragging
                ? "border-[var(--color-text)] bg-[var(--color-surface-raised)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            <Upload size={20} />
            <span>Drag photos here, or click to choose</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
              className="sr-only"
            />
          </label>
          <p className="text-xs text-[var(--color-muted)]">
            {preparing > 0
              ? "Preparing images…"
              : "Full-size photos are fine — they're resized for the web before uploading. The first image is the primary one."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>Notes</h2>
        <div className="space-y-1.5">
          <Label htmlFor="artist_notes">Artist Notes</Label>
          <Textarea
            id="artist_notes"
            value={fields.artist_notes}
            onChange={(e) => set("artist_notes", e.target.value)}
            rows={3}
            maxLength={5000}
            disabled={saving}
            className="resize-y"
            placeholder="Process notes, inspiration, context…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="purchase_instructions">Purchase Instructions</Label>
          <Textarea
            id="purchase_instructions"
            value={fields.purchase_instructions}
            onChange={(e) => set("purchase_instructions", e.target.value)}
            rows={2}
            maxLength={2000}
            disabled={saving}
            className="resize-y"
            placeholder="Shown next to the inquiry button for this work…"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={sectionTitle}>Visibility</h2>
        {[
          { id: "published", label: "Published — visible on the site", checked: published, onChange: setPublished },
          { id: "featured", label: "Featured on the home page", checked: featured, onChange: setFeatured },
        ].map(({ id, label, checked, onChange }) => (
          <label key={id} className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer">
            <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={(e) => {
                onChange(e.target.checked);
                setMessage("");
              }}
              disabled={saving}
            />
            {label}
          </label>
        ))}
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-700">
          {message}
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {saving ? "Saving…" : "Save Artwork"}
      </Button>
    </form>
  );
}
