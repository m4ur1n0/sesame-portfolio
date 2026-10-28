// End-to-end check against a deployed site, driven through the locally installed Google Chrome.
// Creates, verifies and then deletes its own test artworks and inquiry; real content is untouched.
// Uses wrangler (logged in to the site's account) once, to seed an inquiry for the inbox check.
//
//   BASE_URL=https://… ADMIN_PASSWORD=… npm run test:e2e        (HEADED=1 to watch)

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL?.replace(/\/$/, "");
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!BASE || !PASSWORD) throw new Error("BASE_URL and ADMIN_PASSWORD are required");

const run = Date.now().toString(36);
const titleA = `E2E Painting ${run}`;
const titleB = `E2E Draft ${run}`;
const slugA = `e2e-painting-${run}`;

const browser = await chromium.launch({ channel: "chrome", headless: !process.env.HEADED });
const page = await browser.newPage();
page.on("dialog", (d) => d.accept());
const step = (name) => console.log(`✓ ${name}`);

async function status(path) {
  return (await page.request.get(BASE + path, { maxRedirects: 0 })).status();
}

// big camera-sized JPEGs made in the browser, so the test needs no fixture files
async function cameraJpeg(w, h, hue) {
  await page.goto(`${BASE}/robots.txt`);
  const b64 = await page.evaluate(
    async ([w, h, hue]) => {
      const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
      const ctx = c.getContext("2d");
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = (hue + Math.random() * 90) | 0;
        img.data[i + 1] = (Math.random() * 255) | 0;
        img.data[i + 2] = (((i / 4) % w) / w) * 255;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.95));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    },
    [w, h, hue],
  );
  return Buffer.from(b64, "base64");
}

async function adminRow(title) {
  return page.locator("li", { has: page.getByRole("link", { name: title, exact: true }) });
}

try {
  // ——— auth ———
  assert.equal(await status("/admin"), 307);
  await page.context().addCookies([
    { name: "admin_session", value: `${Date.now() + 1e9}.forged`, url: BASE },
  ]);
  assert.equal(await status("/admin"), 307, "forged session cookie must be rejected");
  await page.context().clearCookies();
  assert.equal((await page.request.post(`${BASE}/admin/upload`)).status(), 401);
  step("admin routes and upload reject missing or forged sessions");

  await page.goto(`${BASE}/admin/login`);
  await page.fill("#password", "definitely-wrong");
  await page.click("button[type=submit]");
  await page.getByText("Incorrect password.").waitFor();
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/admin`);
  step("login rejects a wrong password and accepts the right one");

  // ——— create with images ———
  const big = await cameraJpeg(4800, 3600, 120);
  const second = await cameraJpeg(3000, 4000, 20);
  assert.ok(big.length > 3_000_000, `fixture should be camera-sized, got ${big.length}`);

  await page.goto(`${BASE}/admin/artworks/new`);
  await page.fill("#title", titleA);
  assert.equal(await page.inputValue("#slug"), slugA, "slug is derived from title");
  await page.fill("#year", "2026");
  await page.fill("#medium", "Oil on linen");
  await page.fill("#price", "$1,850");
  await page.fill("#description", "A test work created by the e2e script.");
  await page.setInputFiles("input[type=file]", [
    { name: "big.jpg", mimeType: "image/jpeg", buffer: big },
    { name: "second.jpg", mimeType: "image/jpeg", buffer: second },
  ]);
  await page.getByText("Uploads on save").nth(1).waitFor();
  await page.getByLabel("Alt text for image 1").fill("Green abstract test image");
  await page.check("#published");
  await page.check("#featured");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/admin`);
  await (await adminRow(titleA)).getByText("Published").waitFor();
  step("artwork created with two browser-resized images");

  // ——— public rendering ———
  await page.goto(`${BASE}/gallery/${slugA}`);
  const hero = page.locator("main img").first();
  await hero.waitFor();
  const heroSrc = await hero.getAttribute("src");
  assert.match(heroSrc, /^\/media\/[0-9a-f-]{36}\/large\.(webp|jpg)$/);
  assert.equal(await hero.getAttribute("alt"), "Green abstract test image");
  assert.equal(await hero.evaluate((i) => i.naturalWidth), 2400, "large variant capped at 2400px");

  const large = await page.request.get(BASE + heroSrc);
  const thumb = await page.request.get(BASE + heroSrc.replace("large", "thumb"));
  assert.equal(large.status(), 200);
  assert.match(large.headers()["cache-control"], /immutable/);
  const largeBytes = (await large.body()).length;
  const thumbBytes = (await thumb.body()).length;
  assert.ok(largeBytes < big.length / 3, `large ${largeBytes}B vs original ${big.length}B`);
  assert.ok(thumbBytes < largeBytes, "thumb smaller than large");

  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  assert.equal(og, BASE + heroSrc, "og:image is the absolute primary image URL");
  step(`detail page, alt text, OG image; original ${(big.length / 1e6).toFixed(1)}MB → large ${(largeBytes / 1e3) | 0}KB, thumb ${(thumbBytes / 1e3) | 0}KB`);

  await page.goto(BASE);
  await page.getByRole("link", { name: new RegExp(titleA) }).first().waitFor();
  const cardSrc = await page.locator(`a[href="/gallery/${slugA}"] img`).first().getAttribute("src");
  assert.match(cardSrc, /\/thumb\./, "cards use the thumb variant");
  await page.goto(`${BASE}/purchase`);
  await page.locator("#available-heading").waitFor();
  await page.getByText(titleA).first().waitFor();
  const sitemap = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
  assert.ok(sitemap.includes(`/gallery/${slugA}`));
  step("home (featured), purchase page and sitemap list the work");

  // ——— edit: remove an image, its files leave R2 ———
  await page.goto(`${BASE}/admin`);
  await (await adminRow(titleA)).getByRole("link", { name: "Edit" }).click();
  await page.waitForURL(/\/admin\/artworks\/[0-9a-f-]{36}$/);
  const secondPreview = await page.locator("ul img").nth(1).getAttribute("src");
  await page.getByRole("button", { name: "Remove image" }).nth(1).click();
  await page.fill("#price", "$1,900");
  await page.click("button[type=submit]");
  await page.getByText("Saved — live on the site.").waitFor();
  assert.equal(await status(secondPreview), 404, "removed image deleted from R2");
  assert.equal(await status(secondPreview.replace("thumb", "large")), 404);
  step("editing saves in place and removed images are deleted from storage");

  // ——— second artwork: draft, ordering, publish toggle ———
  await page.goto(`${BASE}/admin/artworks/new`);
  await page.fill("#title", titleB);
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/admin`);
  const titles = () => page.locator("ul > li a.font-medium").allInnerTexts();
  assert.equal((await titles())[0], titleB, "new works go to the top");
  await (await adminRow(titleB)).getByRole("button", { name: `Move ${titleB} down` }).click();
  await page.waitForFunction((t) => document.querySelectorAll("ul > li a.font-medium")[1]?.textContent === t, titleB);
  assert.equal((await titles())[0], titleA);
  await (await adminRow(titleB)).getByRole("button", { name: "Publish" }).click();
  await (await adminRow(titleB)).getByRole("button", { name: "Unpublish" }).waitFor();
  await page.goto(`${BASE}/gallery`);
  const order = await page.locator("main h3").allInnerTexts();
  assert.ok(order.indexOf(titleA) < order.indexOf(titleB), "gallery follows admin order");
  step("drafts, reordering and publish toggle work and reach the gallery");

  // ——— contact: Turnstile refuses automated browsers by design, so this proves the server
  // rejects a forged token and keeps the visitor's input; a real send needs a human click ———
  const message = `Is ${titleA} still available? (${run})`;
  await page.goto(`${BASE}/contact?artwork=${slugA}`);
  await page.getByText("Inquiring about:").waitFor();
  await page.getByText(titleA, { exact: true }).waitFor();
  assert.equal(await page.inputValue("#subject"), `Inquiry: ${titleA}`);
  await page.locator('iframe[src*="challenges.cloudflare.com"], .cf-turnstile iframe').or(page.locator('input[name="cf-turnstile-response"]')).first().waitFor({ state: "attached" });
  await page.fill("#name", "E2E Buyer");
  await page.fill("#email", "buyer@example.com");
  await page.fill("#message", message);
  await page.evaluate(() => {
    const form = document.querySelector("form");
    let input = form.querySelector('input[name="cf-turnstile-response"]');
    if (!input) form.append((input = Object.assign(document.createElement("input"), { type: "hidden", name: "cf-turnstile-response" })));
    input.value = "forged-token";
  });
  await page.click("button[type=submit]");
  await page.getByText("Spam check failed. Please try again.").waitFor();
  assert.equal(await page.inputValue("#message"), message, "message survives a failed submit");
  assert.equal(await page.inputValue("#email"), "buyer@example.com");
  step("contact form rejects a forged Turnstile token and keeps the visitor's input");

  // seed an inquiry directly so the inbox can be exercised
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "DB", "--remote", "--command",
      `INSERT INTO inquiries (id, name, email, subject, message, artwork_slug)
       VALUES ('e2e-${run}', 'E2E Buyer', 'buyer@example.com', 'Inquiry: ${titleA}', '${message}', '${slugA}')`],
    { stdio: "ignore" },
  );

  await page.goto(`${BASE}/admin/inbox`);
  const inquiry = page.locator("li", { hasText: run });
  await inquiry.waitFor();
  assert.ok((await page.locator("header a[href='/admin/inbox']").innerText()).match(/Inbox\s*\d+/), "unread badge shown");
  await inquiry.getByRole("button", { name: "Mark read" }).click();
  await inquiry.getByRole("button", { name: "Mark unread" }).waitFor();
  await inquiry.getByRole("button", { name: "Delete" }).click();
  await inquiry.waitFor({ state: "detached" });
  step("inquiry appears in the inbox with unread badge; mark read and delete work");

  // ——— cleanup: deleting artworks removes their files ———
  await page.goto(`${BASE}/gallery/${slugA}`);
  const remaining = await page.locator("main img").first().getAttribute("src");
  await page.goto(`${BASE}/admin`);
  for (const t of [titleA, titleB]) {
    await (await adminRow(t)).getByRole("button", { name: "Delete" }).click();
    await page.getByRole("link", { name: t, exact: true }).waitFor({ state: "detached" });
  }
  assert.equal(await status(remaining), 404, "deleted artwork's image removed from R2");
  assert.equal(await status(`/gallery/${slugA}`), 404);
  step("deleting artworks removes them and their images");

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(`${BASE}/admin/login`);
  assert.equal(await status("/admin"), 307);
  step("sign out ends the session");

  console.log("\nAll end-to-end checks passed.");
} finally {
  await browser.close();
}
