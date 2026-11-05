import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import {
  changePasswordSchema,
  deleteAccountSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  setWornSchema,
} from "@/lib/account-rules";
import { loginUser, logoutUser, registerUser } from "@/server/account/auth";
import {
  changePasswordServer,
  deleteAccountServer,
  loadMyAccount,
  loadSessionUser,
  loadSnobiOptions,
  setWornServer,
  updateProfileServer,
} from "@/server/account/profile";

export const getSnobiOptions = createServerFn({ method: "GET" }).handler(() => loadSnobiOptions());
export const getSessionUser = createServerFn({ method: "GET" }).handler(() => loadSessionUser());
export const getMyAccount = createServerFn({ method: "GET" }).handler(() => loadMyAccount());

export const register = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(({ data }) => registerUser(data));

export const login = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(({ data }) => loginUser(data));

export const logout = createServerFn({ method: "POST" }).handler(() => logoutUser());

export const updateProfile = createServerFn({ method: "POST" })
  .validator(profileSchema)
  .handler(({ data }) => updateProfileServer(data));

export const setWorn = createServerFn({ method: "POST" })
  .validator(setWornSchema)
  .handler(({ data }) => setWornServer(data));

export const changePassword = createServerFn({ method: "POST" })
  .validator(changePasswordSchema)
  .handler(({ data }) => changePasswordServer(data));

export const deleteAccount = createServerFn({ method: "POST" })
  .validator(deleteAccountSchema)
  .handler(({ data }) => deleteAccountServer(data));

export const snobiOptionsQuery = queryOptions({
  queryKey: ["snobi", "snobi-options"],
  queryFn: () => getSnobiOptions(),
  staleTime: 5 * 60_000,
  retry: 1,
});

export const currentUserKey = ["snobi", "current-user"] as const;

// Null when logged out. Pages read it with plain useQuery, so the first paint is logged out.
export const currentUserQuery = queryOptions({
  queryKey: currentUserKey,
  queryFn: () => getSessionUser(),
  staleTime: 60_000,
  retry: false,
});

export const myAccountKey = ["snobi", "my-account"] as const;

export const myAccountQuery = queryOptions({
  queryKey: myAccountKey,
  queryFn: () => getMyAccount(),
  staleTime: 10_000,
  retry: false,
});

export const communityKeys = [
  ["snobi", "leaderboard"],
  ["snobi", "helpers"],
  ["snobi", "donation-feed"],
] as const;
