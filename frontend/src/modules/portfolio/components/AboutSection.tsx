export default function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight mb-12">About</h2>
        <div className="grid md:grid-cols-[280px_1fr] gap-12 items-start">
          <div className="flex justify-center md:justify-start">
            <div className="w-56 h-56 rounded-2xl bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
              KW
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">조광원</h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <span className="font-medium text-foreground">AI</span>와{" "}
                <span className="font-medium text-foreground">풀스택 웹 개발</span>에
                관심을 가진 개발자입니다.
              </p>
              <p>
                문서가 코드보다 먼저라는{" "}
                <span className="font-medium text-foreground">
                  SDD(Specification-Driven Development)
                </span>{" "}
                방법론을 실천하며, 체계적인 설계와 테스트를 통해 안정적인
                소프트웨어를 만들어갑니다.
              </p>
              <p>
                현재{" "}
                <span className="font-medium text-foreground">기원테크</span>
                에서 AI 기반 솔루션을 개발하고 있으며, 이 플랫폼을 통해 개발
                여정을 기록하고 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
