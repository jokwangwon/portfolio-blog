"use client";

import Header from "./Header";
import Footer from "./Footer";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
