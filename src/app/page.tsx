import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingSecurity } from "@/components/landing/landing-security";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/videos");

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingSecurity />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
