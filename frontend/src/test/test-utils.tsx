import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer from "@/src/shell/state/authSlice";

interface AuthState {
  accessToken: string | null;
  user: { username: string; role: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface TestRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: {
    auth: AuthState;
  };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, ...renderOptions }: TestRenderOptions = {}
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    ...(preloadedState && { preloadedState }),
  });

  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
    queryClient,
  };
}

export const authenticatedState = {
  auth: {
    accessToken: "test-token",
    user: { username: "testuser", role: "USER" },
    isAuthenticated: true,
    isLoading: false,
  },
};

export const unauthenticatedState = {
  auth: {
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  },
};
