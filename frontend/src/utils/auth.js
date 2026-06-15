export function getToken() {
  return localStorage.getItem("token");
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("token");
}

export function getRole() {
  try {
    const token = getToken();

    if (!token) {
      return null;
    }

    const payload =
      JSON.parse(
        atob(
          token
            .split(".")[1]
        )
      );

    return (
      payload.role ||
      "student"
    );
  } catch (e) {
    return null;
  }
}
