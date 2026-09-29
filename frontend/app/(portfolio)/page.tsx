import HeroSection from "@/src/modules/portfolio/components/HeroSection";
import AboutSection from "@/src/modules/portfolio/components/AboutSection";
import TechStackSection from "@/src/modules/portfolio/components/TechStackSection";
import ProjectsSection, { PersonalProjectsSection } from "@/src/modules/portfolio/components/ProjectsSection";
import PublicationSection from "@/src/modules/portfolio/components/PublicationSection";
import ExperienceSection from "@/src/modules/portfolio/components/ExperienceSection";
import BlogPreviewSection from "@/src/modules/portfolio/components/BlogPreviewSection";
import ContactSection from "@/src/modules/portfolio/components/ContactSection";

export default function PortfolioPage() {
  return (
    <div className="bg-background">
      <HeroSection />
      <ProjectsSection />
      <PublicationSection />
      <PersonalProjectsSection />
      <AboutSection />
      <TechStackSection />
      <ExperienceSection />
      <BlogPreviewSection />
      <ContactSection />
    </div>
  );
}
