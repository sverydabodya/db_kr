// apps/frontend/src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css"; // Створи цей файл для стилів

export default function Login() {
  const [loginText, setLoginText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = await authApi.login(loginText, passwordText);
      login(data.token); // Зберігаємо токен у контекст та localStorage
      navigate("/"); // Перенаправляємо на головну
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2>Вхід</h2>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.inputGroup}>
          <label>Логін</label>
          <input
            type="text"
            value={loginText}
            onChange={(e) => setLoginText(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Пароль</label>
          <input
            type="password"
            value={passwordText}
            onChange={(e) => setPasswordText(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitBtn}>
          Увійти
        </button>
        <p className={styles.switchMode}>
          Ще не зареєстровані? <Link to="/register">Створити акаунт</Link>
        </p>
      </form>
    </div>
  );
}
