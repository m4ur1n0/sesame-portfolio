// all placeholder content the site owner should replace lives here
export const SITE = {
  name: "Artist Name",
  tagline: "Painter",
  bio: "A short artist bio goes here — a sentence or two about your practice, background, and the work you make. This text appears on the home page and contact page.",
  email: "hello@artistname.com",
  location: "City, State",
  instagram: "",
  twitter: "",
  copyright: `© ${new Date().getFullYear()} Artist Name. All rights reserved.`,

  // home page hero text
  heroHeadline: "Work that takes its time.",
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
    "Questions about a piece, commission inquiries, or just want to say hello — use the form below.",
} as const;
