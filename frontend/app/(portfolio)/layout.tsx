import PortfolioHeader from "@/src/shell/layout/PortfolioHeader";
import Footer from "@/src/shell/layout/Footer";
import { PageTransition } from "@/src/shared/animations/PageTransition";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PortfolioHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
