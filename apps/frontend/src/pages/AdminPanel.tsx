import { useState, useEffect, useMemo } from "react";
import { ramApi } from "../api/ramApi";
import { useAuth } from "../context/AuthContext";
import type {
  RamModel,
  Manufacturer,
  MemoryType,
  FormFactor,
} from "@ram-catalog/shared";
import styles from "./AdminPanel.module.css";

type TabType = "ram" | "manufacturer" | "type" | "formFactor";

interface ExtraFeaturePair {
  key: string;
  value: string;
}

export default function AdminPanel() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("ram");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [models, setModels] = useState<RamModel[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [memoryTypes, setMemoryTypes] = useState<MemoryType[]>([]);
  const [formFactors, setFormFactors] = useState<FormFactor[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const availableFeatureKeys = useMemo(() => {
    const keysSet = new Set<string>();
    models.forEach((m) => {
      if (m.extra_features) {
        Object.keys(m.extra_features).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet).sort();
  }, [models]);

  const loadData = async () => {
    try {
      const [modRes, manRes, typeRes, formRes] = await Promise.all([
        ramApi.getModels(),
        ramApi.getManufacturers(),
        ramApi.getMemoryTypes(),
        ramApi.getFormFactors(),
      ]);
      setModels(modRes);
      setManufacturers(manRes);
      setMemoryTypes(typeRes);
      setFormFactors(formRes);
    } catch (err) {
      console.error("Помилка завантаження даних адмін-панелі", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- СТАНИ ФОРМ ---
  const initialRam = {
    manufacturer_id: "",
    type_id: "",
    form_factor_id: "",
    model_name: "",
    capacity_gb: "",
    frequency_mhz: "",
    cas_latency: "",
    description: "",
    image_url: "",
    extraFeaturesList: [] as ExtraFeaturePair[],
  };

  const initialMan = {
    name: "",
    country: "",
    website: "",
    description: "",
    logo_url: "",
  };
  const initialType = {
    type_name: "",
    default_voltage: "",
    description: "",
    image_url: "",
  };
  const initialForm = { form_factor_name: "", description: "", image_url: "" };

  const [ramData, setRamData] = useState(initialRam);
  const [manData, setManData] = useState(initialMan);
  const [typeData, setTypeData] = useState(initialType);
  const [formData, setFormFactorData] = useState(initialForm);

  const resetForm = () => {
    setEditingId(null);
    setRamData(initialRam);
    setManData(initialMan);
    setTypeData(initialType);
    setFormFactorData(initialForm);
  };

  // --- УПРАВЛІННЯ ДИНАМІЧНИМИ EXTRA_FEATURES ---
  const handleAddFeature = () => {
    setRamData({
      ...ramData,
      extraFeaturesList: [...ramData.extraFeaturesList, { key: "", value: "" }],
    });
  };

  const handleFeatureChange = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const updated = [...ramData.extraFeaturesList];
    updated[index][field] = val;
    setRamData({ ...ramData, extraFeaturesList: updated });
  };

  const handleRemoveFeature = (index: number) => {
    const updated = ramData.extraFeaturesList.filter((_, i) => i !== index);
    setRamData({ ...ramData, extraFeaturesList: updated });
  };

  // --- ОБРОБНИКИ ЗМІН ---
  const handleRamChange = (e: any) =>
    setRamData({
      ...ramData,
      [e.target.name]: e.target.value,
    });
  const handleManChange = (e: any) =>
    setManData({ ...manData, [e.target.name]: e.target.value });
  const handleTypeChange = (e: any) =>
    setTypeData({ ...typeData, [e.target.name]: e.target.value });
  const handleFormFactorChange = (e: any) =>
    setFormFactorData({ ...formData, [e.target.name]: e.target.value });

  // --- УНІВЕРСАЛЬНЕ ЗАВАНТАЖЕННЯ ФАЙЛІВ ---
  const createFileUploadHandler = (
    setState: React.Dispatch<React.SetStateAction<any>>,
    fieldName: string = "image_url"
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Помилка завантаження фото");

      setState((prev: any) => ({ ...prev, [fieldName]: data.url }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- SUBMIT ФОРМ ---
  const handleRamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setStatus({ type: "error", message: "Немає доступу" });
    setIsLoading(true);
    setStatus(null);
    try {
      const extra_features_obj: Record<string, any> = {};
      ramData.extraFeaturesList.forEach((item) => {
        if (item.key.trim() !== "") {
          let val: any = item.value.trim();
          if (val === "true") val = true;
          else if (val === "false") val = false;
          else if (!isNaN(Number(val)) && val !== "") val = Number(val);

          extra_features_obj[item.key.trim()] = val;
        }
      });

      const payload = {
        manufacturer_id: Number(ramData.manufacturer_id),
        type_id: Number(ramData.type_id),
        form_factor_id: Number(ramData.form_factor_id),
        model_name: ramData.model_name,
        capacity_gb: Number(ramData.capacity_gb),
        frequency_mhz: Number(ramData.frequency_mhz),
        cas_latency: ramData.cas_latency
          ? Number(ramData.cas_latency)
          : undefined,
        extra_features: extra_features_obj,
        description: ramData.description || undefined,
        image_url: ramData.image_url || undefined,
      };

      if (editingId) {
        await ramApi.updateModel(editingId, payload, token);
        setStatus({ type: "success", message: "ОЗП успішно оновлено!" });
      } else {
        const res = await ramApi.createModel(payload, token);
        setStatus({ type: "success", message: res.message });
      }
      await loadData();
      resetForm();
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
    if (!token) return;
    setIsLoading(true);
    setStatus(null);
    try {
      if (editingId) {
        const res = await ramApi.updateManufacturer(editingId, manData, token);
        setStatus({ type: "success", message: res.message });
      } else {
        const res = await ramApi.createManufacturer(manData, token);
        setStatus({ type: "success", message: res.message });
      }
      await loadData();
      resetForm();
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
    if (!token) return;
    setIsLoading(true);
    setStatus(null);
    try {
      const payload = {
        ...typeData,
        default_voltage: Number(typeData.default_voltage),
      };
      if (editingId) {
        const res = await ramApi.updateMemoryType(editingId, payload, token);
        setStatus({ type: "success", message: res.message });
      } else {
        const res = await ramApi.createMemoryType(payload, token);
        setStatus({ type: "success", message: res.message });
      }
      await loadData();
      resetForm();
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
    if (!token) return;
    setIsLoading(true);
    setStatus(null);
    try {
      if (editingId) {
        const res = await ramApi.updateFormFactor(editingId, formData, token);
        setStatus({ type: "success", message: res.message });
      } else {
        const res = await ramApi.createFormFactor(formData, token);
        setStatus({ type: "success", message: res.message });
      }
      await loadData();
      resetForm();
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Помилка збереження",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, type: TabType) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей запис?")) return;
    if (!token) return;
    try {
      if (type === "ram") {
        await ramApi.deleteModel(id, token);
      } else if (type === "manufacturer") {
        await ramApi.deleteManufacturer(id, token);
      } else if (type === "type") {
        await ramApi.deleteMemoryType(id, token);
      } else if (type === "formFactor") {
        await ramApi.deleteFormFactor(id, token);
      }
      setStatus({ type: "success", message: "Запис успішно видалено!" });
      await loadData();
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Помилка видалення" });
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.pageTitle}>Панель адміністратора</h2>

      <div className={styles.tabsContainer}>
        {(["ram", "manufacturer", "type", "formFactor"] as TabType[]).map(
          (tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setStatus(null);
                resetForm();
              }}
            >
              {tab === "ram" && "ОЗП"}
              {tab === "manufacturer" && "Виробники"}
              {tab === "type" && "Стандарти"}
              {tab === "formFactor" && "Формфактори"}
            </button>
          ),
        )}
      </div>

      {status && (
        <div
          className={`${styles.statusMessage} ${status.type === "success" ? styles.statusSuccess : styles.statusError}`}
          style={{ marginBottom: "20px" }}
        >
          {status.message}
        </div>
      )}

      {/* --- Вкладка ОЗП --- */}
      {activeTab === "ram" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <h3>{editingId ? "Редагувати ОЗП" : "Додати нову ОЗП"}</h3>
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

                <div className={styles.formGroup}>
                  <label className={styles.label}>Зображення</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={createFileUploadHandler(setRamData, "image_url")}
                    className={styles.input}
                  />
                  {ramData.image_url && (
                    <img
                      src={ramData.image_url}
                      alt="Preview"
                      style={{
                        width: "100px",
                        marginTop: "10px",
                        borderRadius: "6px",
                      }}
                    />
                  )}
                </div>

                {/* --- ДИНАМІЧНІ EXTRA_FEATURES --- */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <label className={styles.label} style={{ margin: 0 }}>
                      Додаткові характеристики
                    </label>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      style={{
                        background: "#0284c7",
                        color: "white",
                        border: "none",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      + Додати поле
                    </button>
                  </div>

                  {ramData.extraFeaturesList.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Ключ (напр. has_rgb, heatsink)"
                        value={item.key}
                        onChange={(e) =>
                          handleFeatureChange(index, "key", e.target.value)
                        }
                        className={styles.input}
                        style={{ flex: 1 }}
                        list="featureKeysList"
                      />

                      <datalist id="featureKeysList">
                        {availableFeatureKeys.map((keyName) => (
                          <option key={keyName} value={keyName} />
                        ))}
                      </datalist>

                      <input
                        type="text"
                        placeholder="Значення (напр. true, алюмінієвий)"
                        value={item.value}
                        onChange={(e) =>
                          handleFeatureChange(index, "value", e.target.value)
                        }
                        className={styles.input}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "0 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
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

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.submitBtn}
                >
                  {isLoading
                    ? "Збереження..."
                    : editingId
                      ? "Зберегти зміни"
                      : "Створити"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.cancelBtn}
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={styles.listCard}>
            <h3>Список моделей</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Бренд</th>
                  <th>Модель</th>
                  <th>Обсяг</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.ram_id}>
                    <td>{m.manufacturer_name}</td>
                    <td>{m.model_name}</td>
                    <td>{m.capacity_gb} ГБ</td>
                    <td>
                      <button
                        onClick={() => {
                          setEditingId(m.ram_id);
                          const featuresList: ExtraFeaturePair = [];
                          if (m.extra_features) {
                            Object.entries(m.extra_features).forEach(
                              ([k, v]) => {
                                featuresList.push({ key: k, value: String(v) });
                              },
                            );
                          }

                          setRamData({
                            manufacturer_id: String(m.manufacturer_id),
                            type_id: String(m.type_id),
                            form_factor_id: String(m.form_factor_id),
                            model_name: m.model_name,
                            capacity_gb: String(m.capacity_gb),
                            frequency_mhz: String(m.frequency_mhz),
                            cas_latency: m.cas_latency
                              ? String(m.cas_latency)
                              : "",
                            description: m.description || "",
                            image_url: m.image_url || "",
                            extraFeaturesList: featuresList,
                          });
                        }}
                        className={styles.editBtn}
                      >
                        Ред.
                      </button>
                      <button
                        onClick={() => handleDelete(m.ram_id, "ram")}
                        className={styles.deleteBtn}
                      >
                        Вид.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Вкладка Виробники --- */}
      {activeTab === "manufacturer" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <h3>{editingId ? "Редагувати виробника" : "Додати виробника"}</h3>
            <form onSubmit={handleManSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Назва *</label>
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
                <label className={styles.label}>Логотип</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={createFileUploadHandler(setManData, "logo_url")}
                  className={styles.input}
                />
                {manData.logo_url && (
                  <img
                    src={manData.logo_url}
                    alt="Preview"
                    style={{
                      width: "100px",
                      marginTop: "10px",
                      borderRadius: "6px",
                    }}
                  />
                )}
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

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.submitBtn}
                >
                  {isLoading
                    ? "Збереження..."
                    : editingId
                      ? "Зберегти"
                      : "Створити"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.cancelBtn}
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={styles.listCard}>
            <h3>Список виробників</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Країна</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {manufacturers.map((m) => (
                  <tr key={m.manufacturer_id}>
                    <td>{m.name}</td>
                    <td>{m.country || "-"}</td>
                    <td>
                      <button
                        onClick={() => {
                          setEditingId(m.manufacturer_id);
                          setManData({
                            name: m.name,
                            country: m.country || "",
                            website: m.website || "",
                            description: m.description || "",
                            logo_url: m.logo_url || "",
                          });
                        }}
                        className={styles.editBtn}
                      >
                        Ред.
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(m.manufacturer_id, "manufacturer")
                        }
                        className={styles.deleteBtn}
                      >
                        Вид.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Вкладка Стандарти пам'яті --- */}
      {activeTab === "type" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <h3>
              {editingId
                ? "Редагувати стандарт пам'яті"
                : "Додати стандарт пам'яті"}
            </h3>
            <form onSubmit={handleTypeSubmit}>
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
                <label className={styles.label}>Зображення</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={createFileUploadHandler(setTypeData, "image_url")}
                  className={styles.input}
                />
                {typeData.image_url && (
                  <img
                    src={typeData.image_url}
                    alt="Preview"
                    style={{
                      width: "100px",
                      marginTop: "10px",
                      borderRadius: "6px",
                    }}
                  />
                )}
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

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.submitBtn}
                >
                  {isLoading
                    ? "Збереження..."
                    : editingId
                      ? "Зберегти зміни"
                      : "Створити"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.cancelBtn}
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={styles.listCard}>
            <h3>Список стандартів</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Стандарт</th>
                  <th>Напруга</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {memoryTypes.map((t) => (
                  <tr key={t.type_id}>
                    <td>{t.type_name}</td>
                    <td>{t.default_voltage} В</td>
                    <td>
                      <button
                        onClick={() => {
                          setEditingId(t.type_id);
                          setTypeData({
                            type_name: t.type_name,
                            default_voltage: String(t.default_voltage),
                            description: t.description || "",
                            image_url: t.image_url || "",
                          });
                        }}
                        className={styles.editBtn}
                      >
                        Ред.
                      </button>
                      <button
                        onClick={() => handleDelete(t.type_id, "type")}
                        className={styles.deleteBtn}
                      >
                        Вид.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Вкладка Формфактори --- */}
      {activeTab === "formFactor" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <h3>{editingId ? "Редагувати формфактор" : "Додати формфактор"}</h3>
            <form onSubmit={handleFormFactorSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Назва формфактора (напр. DIMM, SO-DIMM) *
                </label>
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
                <label className={styles.label}>Схема</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={createFileUploadHandler(setFormFactorData, "image_url")}
                  className={styles.input}
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    style={{
                      width: "100px",
                      marginTop: "10px",
                      borderRadius: "6px",
                    }}
                  />
                )}
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

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.submitBtn}
                >
                  {isLoading
                    ? "Збереження..."
                    : editingId
                      ? "Зберегти зміни"
                      : "Створити"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.cancelBtn}
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={styles.listCard}>
            <h3>Список формфакторів</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Формфактор</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {formFactors.map((f) => (
                  <tr key={f.form_factor_id}>
                    <td>{f.form_factor_name}</td>
                    <td>
                      <button
                        onClick={() => {
                          setEditingId(f.form_factor_id);
                          setFormFactorData({
                            form_factor_name: f.form_factor_name,
                            description: f.description || "",
                            image_url: f.image_url || "",
                          });
                        }}
                        className={styles.editBtn}
                      >
                        Ред.
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(f.form_factor_id, "formFactor")
                        }
                        className={styles.deleteBtn}
                      >
                        Вид.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}