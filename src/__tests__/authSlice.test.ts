import { describe, it, expect } from "vitest";
import authReducer, {
  setUser,
  clearUser,
  setLoading,
  selectUser,
  selectIsLoggedIn,
  selectIsLoading,
} from "@/store/slices/authSlice";
import { makeStore } from "@/store";
import { User } from "@/types";

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  auth_type: "local",
  role: "admin",
  active: true,
  inserted_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("authSlice", () => {
  it("has correct initial state", () => {
    const state = authReducer(undefined, { type: "unknown" });
    expect(state.user).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it("setUser sets user and marks as logged in", () => {
    const state = authReducer(undefined, setUser(mockUser));
    expect(state.user).toEqual(mockUser);
    expect(state.isLoggedIn).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("clearUser resets state", () => {
    let state = authReducer(undefined, setUser(mockUser));
    state = authReducer(state, clearUser());
    expect(state.user).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("setLoading controls loading state", () => {
    let state = authReducer(undefined, setLoading(false));
    expect(state.isLoading).toBe(false);

    state = authReducer(state, setLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it("clearUser after setUser resets everything", () => {
    let state = authReducer(undefined, setUser(mockUser));
    expect(state.isLoggedIn).toBe(true);

    state = authReducer(state, clearUser());
    expect(state.isLoggedIn).toBe(false);
    expect(state.user).toBeNull();
  });
});

describe("auth selectors", () => {
  it("selectors work with store", () => {
    const store = makeStore();

    expect(selectUser(store.getState())).toBeNull();
    expect(selectIsLoggedIn(store.getState())).toBe(false);
    expect(selectIsLoading(store.getState())).toBe(true);

    store.dispatch(setUser(mockUser));

    expect(selectUser(store.getState())).toEqual(mockUser);
    expect(selectIsLoggedIn(store.getState())).toBe(true);
    expect(selectIsLoading(store.getState())).toBe(false);
  });
});
