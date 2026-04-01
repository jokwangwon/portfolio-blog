import HeroSection from "@/src/modules/portfolio/components/HeroSection";
import AboutSection from "@/src/modules/portfolio/components/AboutSection";
import TechStackSection from "@/src/modules/portfolio/components/TechStackSection";
import ProjectsSection from "@/src/modules/portfolio/components/ProjectsSection";
import ExperienceSection from "@/src/modules/portfolio/components/ExperienceSection";
import BlogPreviewSection from "@/src/modules/portfolio/components/BlogPreviewSection";
import ContactSection from "@/src/modules/portfolio/components/ContactSection";

export default function PortfolioPage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <TechStackSection />
      <ProjectsSection />
      <ExperienceSection />
      <BlogPreviewSection />
      <ContactSection />
    </>
  );
}
