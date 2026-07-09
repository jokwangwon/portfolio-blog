"use client";

import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "@shell/state/store";
import { queryClient } from "@shell/api/queryClient";
import AuthProvider from "@shell/auth/AuthProvider";
import DevThemePanel from "@/src/shell/theme/DevThemePanel";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <DevThemePanel />
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}
