import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Catalog from "./pages/Catalog";
import styles from "./App.module.css";
import RamDetails from "./pages/RamDetails";
import Manufacturers from "./pages/Manufacturers";
import MemoryTypes from "./pages/MemoryTypes";
import FormFactors from "./pages/FormFactors";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <Router>
      <div className={styles.appContainer}>
        {/* Горизонтальна навігація */}
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

            <Link
              to="/admin"
              className={`${styles.navLink} ${styles.adminBtn}`}
            >
              Вхід (Адмін)
            </Link>
          </nav>
        </header>

        {/* Головна робоча область */}
        <main className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/ram/:id" element={<RamDetails />} />{" "}
            {/* <-- Новий роут */}
            <Route path="/manufacturers" element={<Manufacturers />} />
            <Route path="/memory-types" element={<MemoryTypes />} />
            <Route path="/form-factors" element={<FormFactors />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
