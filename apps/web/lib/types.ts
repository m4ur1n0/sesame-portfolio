export const AVAILABILITY = [
  "available",
  "inquire",
  "reserved",
  "sold",
  "not_for_sale",
] as const;

export type Availability = (typeof AVAILABILITY)[number];

// one uploaded image; stored in R2 as `${id}/thumb.${ext}` and `${id}/large.${ext}`
export interface ArtworkImage {
  id: string;
  ext: "webp" | "jpg";
  w: number; // large variant dimensions
  h: number;
  alt: string;
}

export interface Artwork {
  id: string;
  slug: string;
  title: string;
  year: string | null;
  medium: string | null;
  dimensions: string | null;
  price: string | null;
  description: string | null;
  artist_notes: string | null;
  purchase_instructions: string | null;
  availability: Availability;
  images: ArtworkImage[];
  published: boolean;
  featured: boolean;
  sort_order: number;
  published_at: string | null;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  artwork_slug: string | null;
  read_at: string | null;
  created_at: string;
}
