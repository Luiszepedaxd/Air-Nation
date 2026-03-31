import Navbar           from "@/components/landing/Navbar";
import Hero             from "@/components/landing/Hero";
import Features         from "@/components/landing/Features";
import HowItWorks       from "@/components/landing/HowItWorks";
import CommunitySection from "@/components/landing/CommunitySection";
import Footer           from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-an-bg">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CommunitySection />
      <Footer />
    </main>
  );
}
