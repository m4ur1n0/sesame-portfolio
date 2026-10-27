// all placeholder content the site owner should replace lives here

// controls where the paintbrush cursor effect appears
// "all-pages" | "home-only" | "disabled"
export type PaintScope = "all-pages" | "home-only" | "disabled";

export const SITE = {
  paintEffectScope: "all-pages" as PaintScope,
  name: "Sesame Campbell",
  tagline: "Artist, Advisor, Advocate",
  bio: "Sesame Campbell is a fine artist from upstate New York, specializing in painting and colored pencil rendering.",
  email: "sesamecity@gmail.com",
  location: "Stephentown, NY",
  instagram: "",
  twitter: "",
  copyright: `© ${new Date().getFullYear()} Sesame Campbell. All rights reserved.`,

  // home page hero text
  heroHeadline: "Art with inspiration...",
  heroSubtext:
    "Original paintings available for sale, commission, and inquiry.",

  // purchase page copy
  purchaseNote:
    "All works are sold unframed unless otherwise noted. Prices are listed in USD.",
  shippingNote:
    "Domestic shipping is available. International shipping on request. Please contact for details.",
  commissionNote:
    "Commissions are currently open. Reach out via the contact form to begin a conversation.",

  // contact page intro
  contactIntro:
    "Use the form below for questions about a piece, commission inquiries, or if you just want to say hello.",
} as const;
