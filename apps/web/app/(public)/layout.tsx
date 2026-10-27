import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PaintCursorBackground } from "@/components/PaintCursorBackground";
import { SITE } from "@/lib/site";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* canvas sits at z-0 beneath everything */}
      <PaintCursorBackground scope={SITE.paintEffectScope} />

      {/* all visible content lives in this z-10 stacking context */}
      <div className="relative z-10 flex flex-col flex-1">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
