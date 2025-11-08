import { api1 } from "./api";

export async function getMe() {
  const { data } = await api1.get("/me");
  return data as { email: string; name?: string; role: string; active: boolean };
}

export async function updateName(name: string) {
  const { data } = await api1.put("/me/profile", { name });
  return data as { message: string; name: string };
}

export async function updateEmail(email: string, current_password: string) {
  const { data } = await api1.put("/me/email", { email, current_password });
  return data as { message: string; email: string; token: string; role: string; active: boolean };
}

export async function changePassword(current_password: string, new_password: string) {
  const { data } = await api1.put("/me/password", { current_password, new_password });
  return data as { message: string };
}
