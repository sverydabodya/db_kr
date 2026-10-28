// apps/frontend/src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Додаємо прапорець завантаження
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Починаємо з true

  useEffect(() => {
    // При першому монтуванні перевіряємо localStorage
    const savedToken = localStorage.getItem("ram_token");
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false); // Перевірку завершено
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("ram_token", newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("ram_token");
  };

  return (
    <AuthContext.Provider
      value={{ token, login, logout, isAuthenticated: !!token, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
