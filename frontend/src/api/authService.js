import api from "./apiClient";


export async function loginUser(email, password) {
  const form = new URLSearchParams();

  form.append("username", email);
  form.append("password", password);

  const res = await api.post("/auth/login", form, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return res.data;
}

export async function registerUser(data) {
  const res = await api.post("/auth/register", {
    name: data.name,
    email: data.email,
    password: data.password,
    roll_number: data.roll_number,
  });

  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}