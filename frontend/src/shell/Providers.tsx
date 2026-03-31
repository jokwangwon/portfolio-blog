"use client";

import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "@shell/state/store";
import { queryClient } from "@shell/api/queryClient";
import AuthProvider from "@shell/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}
