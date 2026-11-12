import { useSyncExternalStore } from "react";
import { pb, currentUser } from "./pocketbase";
import type { User } from "../types";

function readUser(): User | null {
  return pb.authStore.isValid ? currentUser() : null;
}

// pb.authStore.record parses localStorage on every access and returns a new
// object each time, so it can't be used as a snapshot directly (React would
// re-render forever). Cache it and only refresh when the auth store changes.
// Registered at module load, so it runs before any component's listener.
let cachedUser = readUser();
pb.authStore.onChange(() => {
  cachedUser = readUser();
});

function subscribe(callback: () => void) {
  return pb.authStore.onChange(callback);
}

function getSnapshot(): User | null {
  return cachedUser;
}

/** Re-renders whenever the user logs in, logs out or updates their profile. */
export function useAuth(): User | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}
