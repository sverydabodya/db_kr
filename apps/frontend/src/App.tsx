import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Catalog from "./pages/Catalog";
import styles from "./App.module.css";
import RamDetails from "./pages/RamDetails";
import Manufacturers from "./pages/Manufacturers";
import MemoryTypes from "./pages/MemoryTypes";
import FormFactors from "./pages/FormFactors";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";

function App() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <Router>
      <div className={styles.appContainer}>
        <header className={styles.header}>
          <Link to="/" className={styles.headerLogo}>
            Довідник ОЗП
          </Link>

          <nav className={styles.headerNav}>
            <Link to="/" className={styles.navLink}>
              Каталог пам'яті
            </Link>
            <Link to="/manufacturers" className={styles.navLink}>
              Виробники
            </Link>
            <Link to="/memory-types" className={styles.navLink}>
              Стандарти пам'яті
            </Link>
            <Link to="/form-factors" className={styles.navLink}>
              Формфактори
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/admin" className={styles.navLink}>
                  Адмін панель
                </Link>
                <button onClick={logout} className={styles.logoutButton}>
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.navLink}>
                  Увійти
                </Link>
                <Link to="/register" className={styles.navLink}>
                  Реєстрація
                </Link>
              </>
            )}
          </nav>
        </header>

        <main className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/ram/:id" element={<RamDetails />} />{" "}
            <Route path="/manufacturers" element={<Manufacturers />} />
            <Route path="/memory-types" element={<MemoryTypes />} />
            <Route path="/form-factors" element={<FormFactors />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
