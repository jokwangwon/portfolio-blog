import PortfolioHeader from "@/src/shell/layout/PortfolioHeader";
import Footer from "@/src/shell/layout/Footer";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PortfolioHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
