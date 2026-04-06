"use client";

import dynamic from "next/dynamic";

const PixelOffice = dynamic(() => import("./PixelOffice"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[512px] aspect-[4/3] rounded-lg bg-muted animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading Pixel Office...</span>
    </div>
  ),
});

export default function OfficeCanvas({ className }: { className?: string }) {
  return (
    <div className={className}>
      <PixelOffice />
    </div>
  );
}
