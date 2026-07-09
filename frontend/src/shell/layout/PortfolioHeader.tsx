"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/src/shell/theme/useTheme";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu, X } from "lucide-react";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Blog", href: "/blog" },
];

export default function PortfolioHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavClick(href: string) {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "glass-header"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-foreground tracking-tight"
        >
          KW
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) =>
            item.href.startsWith("#") ? (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
          >
            {theme === "light" ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </Button>
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
          >
            {theme === "light" ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden glass-header border-t border-border">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2">
            {navItems.map((item) =>
              item.href.startsWith("#") ? (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
