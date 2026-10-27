"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { PaintScope } from "@/lib/site";

const CFG = {
  brushWidth: 150,          // was 90; ≈ 1.65× wider
  brushOpacity: 0.05,       // applied ONCE when compositing the opaque mask
  visibleDuration: 1500,
  fadeDuration: 500,
  totalLifetime: 2000,
  pointSpacing: 5,
  bristleGroupsMin: 8,
  bristleGroupsMax: 12,
  bristleDepthMax: 0.20,    // ≈ 20% of brush width forward projection
  bristleNotchMax: 0.14,    // ≈ 14% of brush width recession
  bristleNotchChance: 0.15, // portion of groups that form deep notches
  bristleFlatChance: 0.15,  // portion of groups that are near-flat blunt tops
  maxPointsPerStroke: 400,
  maxDpr: 1.5,
  minMove: 1.5,
  strokePauseMs: 500,
  paintR: 176,
  paintG: 141,
  paintB: 107,
} as const;

interface SpinePoint {
  x: number;
  y: number;
  perpX: number;   // fallback perpendicular for endpoints or sharp reversals
  perpY: number;
}

interface EdgePoint {
  t: number;       // 0..1 across the leading edge from B_right to B_left
  depth: number;   // fraction of brushWidth, positive = forward projection
}

interface Stroke {
  id: number;
  points: SpinePoint[];
  lastInputAt: number;
  leadingDirX: number;
  leadingDirY: number;
  leadingPattern: EdgePoint[];
}

function easeOut(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

function normalize(x: number, y: number): [number, number] {
  const l = Math.sqrt(x * x + y * y);
  return l > 1e-6 ? [x / l, y / l] : [1, 0];
}

// generates one bristle-group pattern for a stroke.
// each group contributes two plateau endpoints at the same depth, so the polygon
// walks up one shoulder, across the blunt plateau, down the next shoulder.
// depths mix: projecting bristle groups, near-flat short bristles, deep recessed notches.
function makePattern(): EdgePoint[] {
  const pts: EdgePoint[] = [];
  const groups =
    CFG.bristleGroupsMin +
    Math.floor(Math.random() * (CFG.bristleGroupsMax - CFG.bristleGroupsMin + 1));

  let t = 0;
  for (let g = 0; g < groups && t < 1; g++) {
    const remaining = 1 - t;
    const groupsLeft = groups - g;
    const avg = remaining / groupsLeft;
    let gw = avg * (0.55 + Math.random() * 0.9); // 0.55×–1.45× average width
    if (g === groups - 1) gw = remaining;

    const plateauFrac = 0.35 + Math.random() * 0.4; // 35–75% of the group
    const shoulder = (gw * (1 - plateauFrac)) / 2;

    let depth: number;
    const roll = Math.random();
    if (roll < CFG.bristleNotchChance) {
      // deep notch (paint recessed inward relative to the tip)
      depth = -(0.04 + Math.random() * CFG.bristleNotchMax);
    } else if (roll < CFG.bristleNotchChance + CFG.bristleFlatChance) {
      // near-flat blunt top
      depth = 0.01 + Math.random() * 0.04;
    } else {
      // regular protruding bristle group
      depth = 0.05 + Math.random() * CFG.bristleDepthMax;
    }

    pts.push({ t: Math.min(1, t + shoulder), depth });
    pts.push({ t: Math.min(1, t + gw - shoulder), depth });

    t += gw;
  }

  return pts;
}

// averaged perpendicular at spine point i. combines incoming and outgoing tangents
// so the ribbon boundary doesn't spike inward on curves. falls back to the stored
// perpendicular on hard reversals or at endpoints.
function perpAt(pts: SpinePoint[], i: number): [number, number] {
  let ix = 0, iy = 0;
  if (i > 0) {
    ix = pts[i].x - pts[i - 1].x;
    iy = pts[i].y - pts[i - 1].y;
    const l = Math.sqrt(ix * ix + iy * iy);
    if (l > 1e-6) { ix /= l; iy /= l; }
  }
  let ox = 0, oy = 0;
  if (i < pts.length - 1) {
    ox = pts[i + 1].x - pts[i].x;
    oy = pts[i + 1].y - pts[i].y;
    const l = Math.sqrt(ox * ox + oy * oy);
    if (l > 1e-6) { ox /= l; oy /= l; }
  }
  const ax = ix + ox;
  const ay = iy + oy;
  const l = Math.sqrt(ax * ax + ay * ay);
  if (l < 0.15) return [pts[i].perpX, pts[i].perpY];
  return [-ay / l, ax / l];
}

interface Props { scope: PaintScope; }

export function PaintCursorBackground({ scope }: Props) {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeIdRef = useRef<number | null>(null);
  const strokeIdCounterRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const active =
    scope !== "disabled" && (scope === "all-pages" || pathname === "/");

  const ensureLoop = useCallback(() => {
    if (rafRef.current !== null) return;

    const tick = () => {
      const canvas = canvasRef.current;
      const mask = maskRef.current;
      if (!canvas || !mask) {
        rafRef.current = null;
        return;
      }
      const ctx = canvas.getContext("2d");
      const mctx = mask.getContext("2d");
      if (!ctx || !mctx) {
        rafRef.current = null;
        return;
      }

      const now = Date.now();

      // fade uniformly per stroke based on lastInputAt so overlapping coverage
      // inside a stroke can never accumulate darkness
      strokesRef.current = strokesRef.current.filter(
        (s) => now - s.lastInputAt < CFG.totalLifetime,
      );

      const dpr = Math.min(window.devicePixelRatio || 1, CFG.maxDpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (strokesRef.current.length === 0) {
        rafRef.current = null;
        return;
      }

      const hw = CFG.brushWidth / 2;
      const paintColor = `rgb(${CFG.paintR},${CFG.paintG},${CFG.paintB})`;

      for (const stroke of strokesRef.current) {
        const pts = stroke.points;
        if (pts.length < 2) continue;

        const age = now - stroke.lastInputAt;
        let fa = 1;
        if (age > CFG.visibleDuration) {
          fa = easeOut(1 - (age - CFG.visibleDuration) / CFG.fadeDuration);
          if (fa <= 0) continue;
        }

        // ── mask pass ───────────────────────────────────────────────
        // draw the stroke as opaque coverage. overlapping quads merge in the mask
        // without becoming darker — the mask is a binary shape, not translucent paint.
        mctx.setTransform(1, 0, 0, 1, 0, 0);
        mctx.clearRect(0, 0, mask.width, mask.height);
        mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        mctx.globalAlpha = 1;
        mctx.fillStyle = paintColor;

        // interior body: adjacent quads share exact boundary corners → no seams
        const bodyEnd = pts.length - 2;
        for (let i = 0; i < bodyEnd; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const [px1, py1] = perpAt(pts, i);
          const [px2, py2] = perpAt(pts, i + 1);

          const ALx = p1.x - px1 * hw, ALy = p1.y - py1 * hw;
          const ARx = p1.x + px1 * hw, ARy = p1.y + py1 * hw;
          const BLx = p2.x - px2 * hw, BLy = p2.y - py2 * hw;
          const BRx = p2.x + px2 * hw, BRy = p2.y + py2 * hw;

          mctx.beginPath();
          mctx.moveTo(ALx, ALy);
          mctx.lineTo(ARx, ARy);
          mctx.lineTo(BRx, BRy);
          mctx.lineTo(BLx, BLy);
          mctx.closePath();
          mctx.fill();
        }

        // terminal segment merged with the bristle-shaped leading edge
        {
          const N = pts.length;
          const p1 = pts[N - 2];
          const p2 = pts[N - 1];
          const [px1, py1] = perpAt(pts, N - 2);
          const ALx = p1.x - px1 * hw, ALy = p1.y - py1 * hw;
          const ARx = p1.x + px1 * hw, ARy = p1.y + py1 * hw;

          // the terminal edge sits perpendicular to the actual final direction,
          // not the smoothed one, so bristles always face the way the brush moved
          const dx = stroke.leadingDirX;
          const dy = stroke.leadingDirY;
          const pdx = -dy, pdy = dx;
          const BLx = p2.x - pdx * hw, BLy = p2.y - pdy * hw;
          const BRx = p2.x + pdx * hw, BRy = p2.y + pdy * hw;

          mctx.beginPath();
          mctx.moveTo(ALx, ALy);
          mctx.lineTo(ARx, ARy);
          mctx.lineTo(BRx, BRy);
          for (const ep of stroke.leadingPattern) {
            const ex = BRx + ep.t * (BLx - BRx) + dx * ep.depth * CFG.brushWidth;
            const ey = BRy + ep.t * (BLy - BRy) + dy * ep.depth * CFG.brushWidth;
            mctx.lineTo(ex, ey);
          }
          mctx.lineTo(BLx, BLy);
          mctx.closePath();
          mctx.fill();
        }

        // ── composite pass ─────────────────────────────────────────
        // this is the only place translucency is applied. mask coverage is either
        // "painted" or "not painted"; the whole stroke is composited at exactly
        // paintOpacity × fade. no additive buildup on curves, retraces, or overlaps.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = CFG.brushOpacity * fa;
        ctx.drawImage(mask, 0, 0);
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(any-pointer: fine)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // one offscreen mask, kept the same physical size as the visible canvas
    const mask = document.createElement("canvas");
    maskRef.current = mask;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, CFG.maxDpr);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      mask.width = canvas.width;
      mask.height = canvas.height;
    };
    resize();

    const boundPoints = (s: Stroke) => {
      while (s.points.length > CFG.maxPointsPerStroke) s.points.shift();
    };

    const processPoint = (nx: number, ny: number, now: number) => {
      const last = lastRef.current;
      let stroke: Stroke | undefined;
      if (activeStrokeIdRef.current !== null) {
        stroke = strokesRef.current.find((s) => s.id === activeStrokeIdRef.current);
      }

      const shouldStartNew =
        !last || !stroke || now - last.t >= CFG.strokePauseMs;

      if (shouldStartNew) {
        strokeIdCounterRef.current++;
        const id = strokeIdCounterRef.current;
        const seed: Stroke = {
          id,
          points: [{ x: nx, y: ny, perpX: 0, perpY: 1 }],
          lastInputAt: now,
          leadingDirX: 1,
          leadingDirY: 0,
          leadingPattern: makePattern(),
        };
        strokesRef.current.push(seed);
        activeStrokeIdRef.current = id;
        lastRef.current = { x: nx, y: ny, t: now };
        return;
      }

      const s = stroke!;
      const L = last!;
      const dx = nx - L.x;
      const dy = ny - L.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CFG.minMove) {
        // preserve the anchor position, only refresh timestamp so continuity survives
        lastRef.current = { x: L.x, y: L.y, t: now };
        return;
      }

      const [normX, normY] = normalize(dx, dy);
      const perpX = -normY;
      const perpY = normX;

      if (s.points.length === 1) {
        s.points[0].perpX = perpX;
        s.points[0].perpY = perpY;
      }

      const steps = Math.max(1, Math.ceil(dist / CFG.pointSpacing));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        s.points.push({
          x: L.x + dx * t,
          y: L.y + dy * t,
          perpX,
          perpY,
        });
      }

      s.leadingDirX = normX;
      s.leadingDirY = normY;
      s.lastInputAt = now;
      lastRef.current = { x: nx, y: ny, t: now };
      boundPoints(s);
    };

    const onMove = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      const now = Date.now();
      const coalesced =
        typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      if (coalesced.length > 0) {
        for (const evt of coalesced) processPoint(evt.clientX, evt.clientY, now);
      } else {
        processPoint(e.clientX, e.clientY, now);
      }
      ensureLoop();
    };

    const onLeave = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      lastRef.current = null;
      activeStrokeIdRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      maskRef.current = null;
      strokesRef.current = [];
      activeStrokeIdRef.current = null;
      lastRef.current = null;
    };
  }, [active, ensureLoop]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
