import Header from "@/src/shell/layout/Header";
import Footer from "@/src/shell/layout/Footer";
import { PageTransition } from "@/src/shared/animations/PageTransition";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
