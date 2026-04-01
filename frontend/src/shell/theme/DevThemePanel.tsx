"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Settings, X, Copy, Check } from "lucide-react";

interface SliderConfig {
  label: string;
  variable: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  format: (val: number) => string;
}

const LIGHT_SLIDERS: SliderConfig[] = [
  {
    label: "메쉬 Gold 투명도",
    variable: "--dev-mesh-gold-opacity",
    min: 0, max: 100, step: 5,
    defaultValue: 50,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "메쉬 Amber 투명도",
    variable: "--dev-mesh-amber-opacity",
    min: 0, max: 100, step: 5,
    defaultValue: 45,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "메쉬 Rose 투명도",
    variable: "--dev-mesh-rose-opacity",
    min: 0, max: 100, step: 5,
    defaultValue: 30,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "메쉬 Gold 채도",
    variable: "--dev-mesh-gold-chroma",
    min: 0, max: 30, step: 1,
    defaultValue: 14,
    unit: "",
    format: (v) => `0.${String(v).padStart(2, "0")}`,
  },
  {
    label: "메쉬 Amber 채도",
    variable: "--dev-mesh-amber-chroma",
    min: 0, max: 30, step: 1,
    defaultValue: 18,
    unit: "",
    format: (v) => `0.${String(v).padStart(2, "0")}`,
  },
  {
    label: "카드 불투명도",
    variable: "--dev-glass-bg-opacity",
    min: 10, max: 90, step: 5,
    defaultValue: 55,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "보더 투명도",
    variable: "--dev-glass-border-opacity",
    min: 5, max: 60, step: 5,
    defaultValue: 25,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "Glow 강도",
    variable: "--dev-glass-glow-opacity",
    min: 0, max: 50, step: 2,
    defaultValue: 20,
    unit: "%",
    format: (v) => `${v}%`,
  },
];

const DARK_SLIDERS: SliderConfig[] = [
  {
    label: "메쉬 Blue 투명도",
    variable: "--dev-mesh-blue-opacity",
    min: 0, max: 100, step: 5,
    defaultValue: 65,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "메쉬 Mid 투명도",
    variable: "--dev-mesh-mid-opacity",
    min: 0, max: 100, step: 5,
    defaultValue: 55,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "메쉬 Cyan 투명도",
    variable: "--dev-mesh-cyan-opacity",
    min: 0, max: 100, step: 5,
    defaultValue: 45,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "메쉬 Blue 채도",
    variable: "--dev-mesh-blue-chroma",
    min: 0, max: 30, step: 1,
    defaultValue: 15,
    unit: "",
    format: (v) => `0.${String(v).padStart(2, "0")}`,
  },
  {
    label: "카드 불투명도",
    variable: "--dev-dark-glass-bg-opacity",
    min: 1, max: 30, step: 1,
    defaultValue: 8,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "보더 투명도",
    variable: "--dev-dark-glass-border-opacity",
    min: 5, max: 40, step: 1,
    defaultValue: 15,
    unit: "%",
    format: (v) => `${v}%`,
  },
  {
    label: "Glow 강도",
    variable: "--dev-dark-glow-opacity",
    min: 0, max: 50, step: 2,
    defaultValue: 20,
    unit: "%",
    format: (v) => `${v}%`,
  },
];

export default function DevThemePanel() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    [...LIGHT_SLIDERS, ...DARK_SLIDERS].forEach((s) => {
      initial[s.variable] = s.defaultValue;
    });
    return initial;
  });

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const handleChange = useCallback((variable: string, value: number, config: SliderConfig) => {
    setValues((prev) => ({ ...prev, [variable]: value }));
    applyValue(variable, value, config);
  }, []);

  const applyValue = (variable: string, value: number, config: SliderConfig) => {
    const root = document.documentElement;

    // Light mesh
    if (variable === "--dev-mesh-gold-opacity" || variable === "--dev-mesh-gold-chroma") {
      updateLightMesh();
    } else if (variable === "--dev-mesh-amber-opacity" || variable === "--dev-mesh-amber-chroma") {
      updateLightMesh();
    } else if (variable === "--dev-mesh-rose-opacity") {
      updateLightMesh();
    }
    // Dark mesh
    else if (variable.includes("mesh-blue") || variable.includes("mesh-mid") || variable.includes("mesh-cyan")) {
      updateDarkMesh();
    }
    // Glass bg
    else if (variable === "--dev-glass-bg-opacity") {
      root.style.setProperty("--glass-bg", `oklch(1 0 0 / ${value}%)`);
      root.style.setProperty("--glass-bg-hover", `oklch(1 0 0 / ${Math.min(value + 15, 95)}%)`);
    } else if (variable === "--dev-dark-glass-bg-opacity") {
      root.style.setProperty("--glass-bg", `oklch(1 0 0 / ${value}%)`);
      root.style.setProperty("--glass-bg-hover", `oklch(1 0 0 / ${Math.min(value + 4, 30)}%)`);
    }
    // Glass border
    else if (variable === "--dev-glass-border-opacity") {
      root.style.setProperty("--glass-border", `oklch(0.78 0.12 75 / ${value}%)`);
      root.style.setProperty("--glass-border-hover", `oklch(0.78 0.12 75 / ${Math.min(value + 20, 80)}%)`);
    } else if (variable === "--dev-dark-glass-border-opacity") {
      root.style.setProperty("--glass-border", `oklch(1 0 0 / ${value}%)`);
      root.style.setProperty("--glass-border-hover", `oklch(1 0 0 / ${Math.min(value + 7, 40)}%)`);
    }
    // Glow
    else if (variable === "--dev-glass-glow-opacity") {
      root.style.setProperty("--glass-glow", `0 0 25px oklch(0.78 0.18 75 / ${value}%)`);
    } else if (variable === "--dev-dark-glow-opacity") {
      root.style.setProperty("--glass-glow", `0 0 25px oklch(0.546 0.245 262 / ${value}%)`);
    }
  };

  const updateLightMesh = () => {
    const goldOp = values["--dev-mesh-gold-opacity"] ?? 50;
    const goldCh = values["--dev-mesh-gold-chroma"] ?? 14;
    const amberOp = values["--dev-mesh-amber-opacity"] ?? 45;
    const amberCh = values["--dev-mesh-amber-chroma"] ?? 18;
    const roseOp = values["--dev-mesh-rose-opacity"] ?? 30;

    const style = document.body;
    style.style.setProperty("--mesh-light",
      `radial-gradient(ellipse 80% 60% at 20% 30%, oklch(0.85 0.${String(goldCh).padStart(2,"0")} 85 / ${goldOp}%) 0%, transparent 65%), ` +
      `radial-gradient(ellipse 60% 80% at 80% 20%, oklch(0.78 0.${String(amberCh).padStart(2,"0")} 75 / ${amberOp}%) 0%, transparent 55%), ` +
      `radial-gradient(ellipse 50% 50% at 60% 80%, oklch(0.72 0.14 25 / ${roseOp}%) 0%, transparent 50%)`
    );
    // Apply via pseudo-element workaround
    updateBodyBeforeBg();
  };

  const updateDarkMesh = () => {
    const blueOp = values["--dev-mesh-blue-opacity"] ?? 65;
    const blueCh = values["--dev-mesh-blue-chroma"] ?? 15;
    const midOp = values["--dev-mesh-mid-opacity"] ?? 55;
    const cyanOp = values["--dev-mesh-cyan-opacity"] ?? 45;

    document.body.style.setProperty("--mesh-dark",
      `radial-gradient(ellipse 80% 50% at 30% 20%, oklch(0.25 0.${String(blueCh).padStart(2,"0")} 262 / ${blueOp}%) 0%, transparent 60%), ` +
      `radial-gradient(ellipse 60% 60% at 70% 60%, oklch(0.30 0.18 230 / ${midOp}%) 0%, transparent 55%), ` +
      `radial-gradient(ellipse 50% 50% at 50% 90%, oklch(0.40 0.15 215 / ${cyanOp}%) 0%, transparent 50%)`
    );
    updateBodyBeforeBg();
  };

  const updateBodyBeforeBg = () => {
    // body::before is not directly stylable via JS, use a dynamic style tag
    let tag = document.getElementById("dev-theme-mesh");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "dev-theme-mesh";
      document.head.appendChild(tag);
    }

    const isDarkNow = document.documentElement.classList.contains("dark");
    const goldOp = values["--dev-mesh-gold-opacity"] ?? 50;
    const goldCh = values["--dev-mesh-gold-chroma"] ?? 14;
    const amberOp = values["--dev-mesh-amber-opacity"] ?? 45;
    const amberCh = values["--dev-mesh-amber-chroma"] ?? 18;
    const roseOp = values["--dev-mesh-rose-opacity"] ?? 30;
    const blueOp = values["--dev-mesh-blue-opacity"] ?? 65;
    const blueCh = values["--dev-mesh-blue-chroma"] ?? 15;
    const midOp = values["--dev-mesh-mid-opacity"] ?? 55;
    const cyanOp = values["--dev-mesh-cyan-opacity"] ?? 45;

    tag.textContent = `
      body::before {
        background: ${isDarkNow
          ? `radial-gradient(ellipse 80% 50% at 30% 20%, oklch(0.25 0.${String(blueCh).padStart(2,"0")} 262 / ${blueOp}%) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 70% 60%, oklch(0.30 0.18 230 / ${midOp}%) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 50% 90%, oklch(0.40 0.15 215 / ${cyanOp}%) 0%, transparent 50%)`
          : `radial-gradient(ellipse 80% 60% at 20% 30%, oklch(0.85 0.${String(goldCh).padStart(2,"0")} 85 / ${goldOp}%) 0%, transparent 65%), radial-gradient(ellipse 60% 80% at 80% 20%, oklch(0.78 0.${String(amberCh).padStart(2,"0")} 75 / ${amberOp}%) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 60% 80%, oklch(0.72 0.14 25 / ${roseOp}%) 0%, transparent 50%)`
        } !important;
      }
    `;
  };

  const exportCSS = () => {
    const isDarkNow = document.documentElement.classList.contains("dark");
    const sliders = isDarkNow ? DARK_SLIDERS : LIGHT_SLIDERS;

    let output = isDarkNow ? "/* Dark Mode Values */\n" : "/* Light Mode Values */\n";
    sliders.forEach((s) => {
      output += `${s.label}: ${s.format(values[s.variable] ?? s.defaultValue)}\n`;
    });
    output += "\n/* CSS Variables */\n";

    if (isDarkNow) {
      const bg = values["--dev-dark-glass-bg-opacity"] ?? 8;
      const border = values["--dev-dark-glass-border-opacity"] ?? 15;
      const glow = values["--dev-dark-glow-opacity"] ?? 20;
      output += `--glass-bg: oklch(1 0 0 / ${bg}%);\n`;
      output += `--glass-bg-hover: oklch(1 0 0 / ${Math.min(bg + 4, 30)}%);\n`;
      output += `--glass-border: oklch(1 0 0 / ${border}%);\n`;
      output += `--glass-border-hover: oklch(1 0 0 / ${Math.min(border + 7, 40)}%);\n`;
      output += `--glass-glow: 0 0 25px oklch(0.546 0.245 262 / ${glow}%);\n`;
    } else {
      const bg = values["--dev-glass-bg-opacity"] ?? 55;
      const border = values["--dev-glass-border-opacity"] ?? 25;
      const glow = values["--dev-glass-glow-opacity"] ?? 20;
      output += `--glass-bg: oklch(1 0 0 / ${bg}%);\n`;
      output += `--glass-bg-hover: oklch(1 0 0 / ${Math.min(bg + 15, 95)}%);\n`;
      output += `--glass-border: oklch(0.78 0.12 75 / ${border}%);\n`;
      output += `--glass-border-hover: oklch(0.78 0.12 75 / ${Math.min(border + 20, 80)}%);\n`;
      output += `--glass-glow: 0 0 25px oklch(0.78 0.18 75 / ${glow}%);\n`;
    }

    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sliders = isDark ? DARK_SLIDERS : LIGHT_SLIDERS;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] p-3 rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition-transform"
        aria-label="테마 설정 열기"
      >
        <Settings className="size-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 max-h-[80vh] overflow-y-auto rounded-xl bg-neutral-900 text-neutral-100 backdrop-blur-lg border border-neutral-700 shadow-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          테마 조정 ({isDark ? "Dark" : "Light"})
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={exportCSS} className="h-7 px-2">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 px-2">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {sliders.map((s) => (
          <div key={s.variable}>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>{s.label}</span>
              <span className="font-mono">{s.format(values[s.variable] ?? s.defaultValue)}</span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={values[s.variable] ?? s.defaultValue}
              onChange={(e) => handleChange(s.variable, Number(e.target.value), s)}
              className="w-full h-1.5 rounded-full appearance-none bg-neutral-700 cursor-pointer accent-cyan-400"
            />
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        조정 후 복사 버튼으로 CSS 값 추출
      </p>
    </div>
  );
}
