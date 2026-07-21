export type ContentType = "artwork" | "post";

export type ArtworkAvailability =
  | "available"
  | "sold"
  | "reserved"
  | "not_for_sale"
  | "inquire";

export type PostStatus = "draft" | "published";

export interface Media {
  id: string;
  key: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  alt?: string;
  caption?: string;
  created_at: string;
}

export interface Artwork {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  content_type: ContentType;
  excerpt?: string;
  body_json?: string;
  body_html?: string;
  hero_media_id?: string;
  year?: string;
  medium?: string;
  dimensions?: string;
  price?: string;
  availability: ArtworkAvailability;
  gallery_visible: number;
  purchase_visible: number;
  display_order: number;
  featured: number;
  additional_media_ids?: string;
  artist_notes?: string;
  purchase_instructions?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  content_type: ContentType;
  excerpt?: string;
  body_json?: string;
  body_html?: string;
  hero_media_id?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
  artwork_ref?: string;
}
