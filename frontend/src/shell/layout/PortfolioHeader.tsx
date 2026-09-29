"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/src/shell/theme/useTheme";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu, X } from "lucide-react";

import { siteNavigation } from "./siteNavigation";

export default function PortfolioHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

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
        <nav aria-label="주요 메뉴" className="hidden md:flex items-center gap-1">
          {siteNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
              {item.label}
            </Link>
          ))}
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
            ref={menuButtonRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="portfolio-mobile-menu"
            aria-label="메뉴"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden glass-header border-t border-border">
          <nav id="portfolio-mobile-menu" aria-label="모바일 메뉴" className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2">
            {siteNavigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
