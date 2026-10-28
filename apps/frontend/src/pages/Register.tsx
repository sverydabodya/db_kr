// apps/frontend/src/pages/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function Register() {
  const [loginText, setLoginText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = await authApi.register(loginText, passwordText);
      login(data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2>Реєстрація</h2>
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
          Зареєструватися
        </button>
        <p className={styles.switchMode}>
          Вже маєте акаунт? <Link to="/login">Увійти</Link>
        </p>
      </form>
    </div>
  );
}
