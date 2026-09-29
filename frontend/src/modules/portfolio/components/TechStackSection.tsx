import { techStack, techCategories } from "../data/techStack";
import { MotionSection } from "@/src/shared/animations/MotionSection";

export default function TechStackSection() {
  return (
    <MotionSection id="tech-stack" className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4">기술과 사용 맥락</h2>
        <p className="text-muted-foreground mb-8">실무, 개인 프로젝트, 연구에서 사용한 기술을 구분했습니다.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {techCategories.map((category) => (
            <section key={category} className="glass-card rounded-xl p-5">
              <h3 className="text-base font-semibold mb-5">{category}</h3>
              <dl className="space-y-5">
                {techStack.filter((tech) => tech.category === category).map((tech) => (
                  <div key={tech.name}>
                    <dt className="text-sm font-medium mb-1">{tech.name}</dt>
                    <dd className="text-xs text-muted-foreground leading-relaxed">{tech.usage}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
