export const revalidate = 0;

import Navbar           from "@/components/landing/Navbar";
import Hero             from "@/components/landing/Hero";
import Features         from "@/components/landing/Features";
import ProductPreview   from "@/components/landing/ProductPreview";
import CommunitySection from "@/components/landing/CommunitySection";
import Footer           from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-an-bg">
      <Navbar />
      <Hero />
      <Features />
      <ProductPreview />
      <CommunitySection />
      <Footer />
    </main>
  );
}
