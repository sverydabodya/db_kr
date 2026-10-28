const API_PREFIX = "/api";

export const authApi = {
  login: async (loginText: string, passwordText: string) => {
    const response = await fetch(`${API_PREFIX}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginText, password: passwordText }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Помилка входу");
    }

    return response.json();
  },

  register: async (loginText: string, passwordText: string) => {
    const response = await fetch(`${API_PREFIX}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginText, password: passwordText }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Помилка реєстрації");
    }

    return response.json();
  },
};
