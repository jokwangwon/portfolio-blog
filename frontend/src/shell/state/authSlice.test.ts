import { describe, it, expect } from "vitest";
import authReducer, {
  setCredentials,
  clearCredentials,
  setLoading,
} from "./authSlice";

const initialState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

describe("authSlice", () => {
  it("should return initial state", () => {
    expect(authReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  describe("setCredentials", () => {
    it("should set access token and user", () => {
      const state = authReducer(
        initialState,
        setCredentials({
          accessToken: "test-token",
          user: { username: "testuser", role: "USER" },
        })
      );

      expect(state.accessToken).toBe("test-token");
      expect(state.user).toEqual({ username: "testuser", role: "USER" });
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("clearCredentials", () => {
    it("should clear auth state", () => {
      const authenticatedState = {
        accessToken: "test-token",
        user: { username: "testuser", role: "USER" },
        isAuthenticated: true,
        isLoading: false,
      };

      const state = authReducer(authenticatedState, clearCredentials());

      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("setLoading", () => {
    it("should set loading to true", () => {
      const state = authReducer(
        { ...initialState, isLoading: false },
        setLoading(true)
      );
      expect(state.isLoading).toBe(true);
    });

    it("should set loading to false", () => {
      const state = authReducer(initialState, setLoading(false));
      expect(state.isLoading).toBe(false);
    });
  });
});
