import { useState, useEffect } from "react";
import { ramApi } from "../api/ramApi";
import type { Manufacturer, MemoryType, FormFactor } from "@ram-catalog/shared";
import styles from "./AdminPanel.module.css";

type TabType = "ram" | "manufacturer" | "type" | "formFactor";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("ram");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Списки для випадаючих списків (завантажуються з БД)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [memoryTypes, setMemoryTypes] = useState<MemoryType[]>([]);
  const [formFactors, setFormFactors] = useState<FormFactor[]>([]);

  // Завантаження довідників при монтуванні компонента
  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        const models = await ramApi.getModels();

        // Витягуємо унікальні бренди
        const manMap = new Map();
        models.forEach((m) => {
          if (m.manufacturer_id && m.manufacturer_name) {
            manMap.set(m.manufacturer_id, {
              manufacturer_id: m.manufacturer_id,
              name: m.manufacturer_name,
            });
          }
        });
        setManufacturers(Array.from(manMap.values()));

        // Витягуємо унікальні типи пам'яті
        const typeMap = new Map();
        models.forEach((m) => {
          if (m.type_id && m.type_name) {
            typeMap.set(m.type_id, {
              type_id: m.type_id,
              type_name: m.type_name,
              default_voltage: 1.1,
            });
          }
        });
        setMemoryTypes(Array.from(typeMap.values()));

        // Витягуємо унікальні формфактори
        const formMap = new Map();
        models.forEach((m) => {
          if (m.form_factor_id && m.form_factor_name) {
            formMap.set(m.form_factor_id, {
              form_factor_id: m.form_factor_id,
              form_factor_name: m.form_factor_name,
            });
          }
        });
        setFormFactors(Array.from(formMap.values()));
      } catch (err) {
        console.error("Не вдалося завантажити довідники для адмін-панелі", err);
      }
    };

    fetchDictionaries();
  }, []);

  // --- СТАНИ ФОРМ ---
  const [ramData, setRamData] = useState({
    manufacturer_id: "",
    type_id: "",
    form_factor_id: "",
    model_name: "",
    capacity_gb: "",
    frequency_mhz: "",
    cas_latency: "",
    has_rgb: false,
    description: "",
    image_url: "",
  });

  const [manData, setManData] = useState({
    name: "",
    country: "",
    website: "",
    description: "",
    logo_url: "",
  });

  const [typeData, setTypeData] = useState({
    type_name: "",
    default_voltage: "",
    description: "",
    image_url: "",
  });

  const [formData, setFormFactorData] = useState({
    form_factor_name: "",
    description: "",
    image_url: "",
  });

  // Допоміжна функція для отримання JWT токена
  const getToken = () => localStorage.getItem("token") || "";

  // --- ОБРОБНИКИ ЗМІН ---
  const handleRamChange = (e: any) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setRamData({ ...ramData, [e.target.name]: val });
  };
  const handleManChange = (e: any) =>
    setManData({ ...manData, [e.target.name]: e.target.value });
  const handleTypeChange = (e: any) =>
    setTypeData({ ...typeData, [e.target.name]: e.target.value });
  const handleFormFactorChange = (e: any) =>
    setFormFactorData({ ...formData, [e.target.name]: e.target.value });

  // --- ВІДПРАВКА ДАНИХ (SUBMIT) ---
  const handleRamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const token = getToken();
      const res = await ramApi.createModel(
        {
          manufacturer_id: Number(ramData.manufacturer_id),
          type_id: Number(ramData.type_id),
          form_factor_id: Number(ramData.form_factor_id),
          model_name: ramData.model_name,
          capacity_gb: Number(ramData.capacity_gb),
          frequency_mhz: Number(ramData.frequency_mhz),
          cas_latency: ramData.cas_latency
            ? Number(ramData.cas_latency)
            : undefined,
          extra_features: { has_rgb: ramData.has_rgb },
          description: ramData.description || undefined,
          image_url: ramData.image_url || undefined,
        },
        token,
      );
      setStatus({ type: "success", message: res.message });
      setRamData({
        manufacturer_id: "",
        type_id: "",
        form_factor_id: "",
        model_name: "",
        capacity_gb: "",
        frequency_mhz: "",
        cas_latency: "",
        has_rgb: false,
        description: "",
        image_url: "",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Помилка збереження",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const token = getToken();
      const res = await ramApi.createManufacturer(manData, token);
      setStatus({ type: "success", message: res.message });
      setManData({
        name: "",
        country: "",
        website: "",
        description: "",
        logo_url: "",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Помилка збереження",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const token = getToken();
      const res = await ramApi.createMemoryType(
        { ...typeData, default_voltage: Number(typeData.default_voltage) },
        token,
      );
      setStatus({ type: "success", message: res.message });
      setTypeData({
        type_name: "",
        default_voltage: "",
        description: "",
        image_url: "",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Помилка збереження",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const token = getToken();
      const res = await ramApi.createFormFactor(formData, token);
      setStatus({ type: "success", message: res.message });
      setFormFactorData({
        form_factor_name: "",
        description: "",
        image_url: "",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Помилка збереження",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.pageTitle}>Панель адміністратора</h2>

      {/* Навігація по вкладках */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === "ram" ? styles.active : ""}`}
          onClick={() => {
            setActiveTab("ram");
            setStatus(null);
          }}
        >
          Додати ОЗП
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "manufacturer" ? styles.active : ""}`}
          onClick={() => {
            setActiveTab("manufacturer");
            setStatus(null);
          }}
        >
          Виробник
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "type" ? styles.active : ""}`}
          onClick={() => {
            setActiveTab("type");
            setStatus(null);
          }}
        >
          Стандарт пам'яті
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "formFactor" ? styles.active : ""}`}
          onClick={() => {
            setActiveTab("formFactor");
            setStatus(null);
          }}
        >
          Формфактор
        </button>
      </div>

      <div className={styles.formCard}>
        {status && (
          <div
            className={`${styles.statusMessage} ${status.type === "success" ? styles.statusSuccess : styles.statusError}`}
            style={{ marginBottom: "20px" }}
          >
            {status.message}
          </div>
        )}

        {/* ФОРМА: Модель ОЗП */}
        {activeTab === "ram" && (
          <form onSubmit={handleRamSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Виробник *</label>
                <select
                  name="manufacturer_id"
                  value={ramData.manufacturer_id}
                  onChange={handleRamChange}
                  required
                  className={styles.select}
                >
                  <option value="" disabled>
                    Оберіть виробника
                  </option>
                  {manufacturers.map((m) => (
                    <option key={m.manufacturer_id} value={m.manufacturer_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Назва моделі *</label>
                <input
                  type="text"
                  name="model_name"
                  value={ramData.model_name}
                  onChange={handleRamChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Стандарт пам'яті *</label>
                <select
                  name="type_id"
                  value={ramData.type_id}
                  onChange={handleRamChange}
                  required
                  className={styles.select}
                >
                  <option value="" disabled>
                    Оберіть стандарт
                  </option>
                  {memoryTypes.map((t) => (
                    <option key={t.type_id} value={t.type_id}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Формфактор *</label>
                <select
                  name="form_factor_id"
                  value={ramData.form_factor_id}
                  onChange={handleRamChange}
                  required
                  className={styles.select}
                >
                  <option value="" disabled>
                    Оберіть формфактор
                  </option>
                  {formFactors.map((f) => (
                    <option key={f.form_factor_id} value={f.form_factor_id}>
                      {f.form_factor_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Обсяг (ГБ) *</label>
                <input
                  type="number"
                  name="capacity_gb"
                  value={ramData.capacity_gb}
                  onChange={handleRamChange}
                  required
                  min="1"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Частота (МГц) *</label>
                <input
                  type="number"
                  name="frequency_mhz"
                  value={ramData.frequency_mhz}
                  onChange={handleRamChange}
                  required
                  min="800"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>CAS Latency (CL)</label>
                <input
                  type="number"
                  name="cas_latency"
                  value={ramData.cas_latency}
                  onChange={handleRamChange}
                  min="1"
                  className={styles.input}
                />
              </div>

              <div
                className={styles.formGroup}
                style={{ justifyContent: "center" }}
              >
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="has_rgb"
                    checked={ramData.has_rgb}
                    onChange={handleRamChange}
                    className={styles.checkbox}
                  />
                  RGB підсвічування
                </label>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Опис моделі</label>
                <textarea
                  name="description"
                  value={ramData.description}
                  onChange={handleRamChange}
                  className={styles.textarea}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? "Збереження..." : "Зберегти модель ОЗП"}
            </button>
          </form>
        )}

        {/* ФОРМА: Виробник */}
        {activeTab === "manufacturer" && (
          <form onSubmit={handleManSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Назва бренду *</label>
                <input
                  type="text"
                  name="name"
                  value={manData.name}
                  onChange={handleManChange}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Країна</label>
                <input
                  type="text"
                  name="country"
                  value={manData.country}
                  onChange={handleManChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Сайт (URL)</label>
                <input
                  type="url"
                  name="website"
                  value={manData.website}
                  onChange={handleManChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Логотип (URL)</label>
                <input
                  type="url"
                  name="logo_url"
                  value={manData.logo_url}
                  onChange={handleManChange}
                  className={styles.input}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Опис компанії</label>
                <textarea
                  name="description"
                  value={manData.description}
                  onChange={handleManChange}
                  className={styles.textarea}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? "Збереження..." : "Додати виробника"}
            </button>
          </form>
        )}

        {/* ФОРМА: Стандарт пам'яті */}
        {activeTab === "type" && (
          <form onSubmit={handleTypeSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Назва стандарту (напр. DDR5) *
                </label>
                <input
                  type="text"
                  name="type_name"
                  value={typeData.type_name}
                  onChange={handleTypeChange}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Базова напруга (Вольт) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="default_voltage"
                  value={typeData.default_voltage}
                  onChange={handleTypeChange}
                  required
                  min="0"
                  className={styles.input}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Зображення (URL)</label>
                <input
                  type="url"
                  name="image_url"
                  value={typeData.image_url}
                  onChange={handleTypeChange}
                  className={styles.input}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Опис стандарту</label>
                <textarea
                  name="description"
                  value={typeData.description}
                  onChange={handleTypeChange}
                  className={styles.textarea}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? "Збереження..." : "Додати стандарт"}
            </button>
          </form>
        )}

        {/* ФОРМА: Формфактор */}
        {activeTab === "formFactor" && (
          <form onSubmit={handleFormFactorSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Назва формфактора *</label>
                <input
                  type="text"
                  name="form_factor_name"
                  value={formData.form_factor_name}
                  onChange={handleFormFactorChange}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Схема (URL)</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleFormFactorChange}
                  className={styles.input}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Опис формфактора</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormFactorChange}
                  className={styles.textarea}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? "Збереження..." : "Додати формфактор"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
