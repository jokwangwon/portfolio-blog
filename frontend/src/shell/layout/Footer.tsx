import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 Portfolio Platform. All rights reserved.</p>
      </div>
    </footer>
  );
}
