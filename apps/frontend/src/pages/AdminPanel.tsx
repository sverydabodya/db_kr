import { useState, useEffect } from "react";
import { ramApi } from "../api/ramApi";
import { useAuth } from "../context/AuthContext";
import type {
  RamModel,
  Manufacturer,
  MemoryType,
  FormFactor,
} from "@ram-catalog/shared";
import styles from "./AdminPanel.module.css";

type TabType = "ram" | "manufacturer" | "type" | "formFactor" | "feature";

interface ExtraFeaturePair {
  key: string;
  value: any;
}

export interface FeatureDefinition {
  feature_id?: number;
  feature_name: string;
  display_type: "boolean" | "text" | "select" | "multiselect" | "number";
  options?: string[];
  is_required?: boolean;
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
  const [featureDefs, setFeatureDefs] = useState<FeatureDefinition[]>([]);

  // Пошуковий рядок для фільтрації списків
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [modRes, manRes, typeRes, formRes, defsRes] = await Promise.all([
        ramApi.getModels(),
        ramApi.getManufacturers(),
        ramApi.getMemoryTypes(),
        ramApi.getFormFactors(),
        ramApi.getFeatureDefinitions(), // Оновлений запит довідника
      ]);
      setModels(modRes);
      setManufacturers(manRes);
      setMemoryTypes(typeRes);
      setFormFactors(formRes);
      setFeatureDefs(defsRes);
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
  const initialFeatureDef = {
    feature_name: "",
    display_type: "text",
    options: "",
  };

  const [ramData, setRamData] = useState(initialRam);
  const [manData, setManData] = useState(initialMan);
  const [typeData, setTypeData] = useState(initialType);
  const [formData, setFormFactorData] = useState(initialForm);
  const [featureDefData, setFeatureDefData] = useState(initialFeatureDef);

  const resetForm = () => {
    setEditingId(null);
    setRamData(initialRam);
    setManData(initialMan);
    setTypeData(initialType);
    setFormFactorData(initialForm);
    setFeatureDefData(initialFeatureDef);
  };

  // Перевірка на булевий тип зі старого формату даних
  const isFeaturePresent = (val: any) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const lower = val.trim().toLowerCase();
      return lower === "є" || lower === "true" || lower === "yes";
    }
    return false;
  };

  // --- УПРАВЛІННЯ ДИНАМІЧНИМИ ХАРАКТЕРИСТИКАМИ (ОЗП) ---
  const handleAddFeature = () => {
    setRamData({
      ...ramData,
      extraFeaturesList: [...ramData.extraFeaturesList, { key: "", value: "" }],
    });
  };

  const handleFeatureChange = (
    index: number,
    field: "key" | "value",
    val: any,
  ) => {
    const updated = [...ramData.extraFeaturesList];

    if (field === "key") {
      updated[index].key = val;
      const def = featureDefs.find((d) => d.feature_name === val);
      if (def?.display_type === "boolean") {
        updated[index].value = true;
      } else if (def?.display_type === "select" && def.options?.length) {
        updated[index].value = def.options[0];
      } else if (def?.display_type === "multiselect") {
        updated[index].value = []; // Ініціалізуємо порожнім масивом
      } else {
        updated[index].value = "";
      }
    } else {
      updated[index].value = val;
    }

    setRamData({ ...ramData, extraFeaturesList: updated });
  };

  // Спеціальний обробник для чекбоксів всередині multiselect
  const handleMultiselectChange = (
    index: number,
    option: string,
    isChecked: boolean,
  ) => {
    const updated = [...ramData.extraFeaturesList];
    let currentValues = updated[index].value;

    if (!Array.isArray(currentValues)) {
      currentValues = currentValues
        ? typeof currentValues === "string"
          ? currentValues.split(",").map((s: string) => s.trim())
          : [String(currentValues)]
        : [];
    }

    if (isChecked) {
      if (!currentValues.includes(option)) {
        currentValues.push(option);
      }
    } else {
      currentValues = currentValues.filter((v: string) => v !== option);
    }

    updated[index].value = currentValues;
    setRamData({ ...ramData, extraFeaturesList: updated });
  };

  const handleRemoveFeature = (index: number) => {
    const updated = ramData.extraFeaturesList.filter((_, i) => i !== index);
    setRamData({ ...ramData, extraFeaturesList: updated });
  };

  // --- ОБРОБНИКИ ПОДІЙ ---
  const handleRamChange = (e: any) =>
    setRamData({ ...ramData, [e.target.name]: e.target.value });
  const handleManChange = (e: any) =>
    setManData({ ...manData, [e.target.name]: e.target.value });
  const handleTypeChange = (e: any) =>
    setTypeData({ ...typeData, [e.target.name]: e.target.value });
  const handleFormFactorChange = (e: any) =>
    setFormFactorData({ ...formData, [e.target.name]: e.target.value });
  const handleFeatureDefChange = (e: any) =>
    setFeatureDefData({ ...featureDefData, [e.target.name]: e.target.value });

  // --- ЗАВАНТАЖЕННЯ ФАЙЛІВ ---
  const createFileUploadHandler =
    (
      setState: React.Dispatch<React.SetStateAction<any>>,
      fieldName: string = "image_url",
    ) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !token) return;

      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
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

  // --- ВІДПРАВКА ФОРМ ---
  const handleRamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token)
      return setStatus({ type: "error", message: "Необхідна авторизація" });
    setIsLoading(true);
    setStatus(null);

    try {
      const extra_features_obj: Record<string, any> = {};

      ramData.extraFeaturesList.forEach((item) => {
        const trimmedKey = item.key.trim();
        if (trimmedKey !== "") {
          const def = featureDefs.find((d) => d.feature_name === trimmedKey);
          const displayType = def ? def.display_type : "text";
          let val = item.value;

          if (displayType === "boolean") {
            val = Boolean(val);
            if (val === true) val = "Є";
          } else if (displayType === "multiselect") {
            if (typeof val === "string") {
              val = val
                .split(",")
                .map((v: string) => v.trim())
                .filter(Boolean);
            } else if (!Array.isArray(val)) {
              val = [];
            }
          } else if (displayType === "number") {
            val = Number(val);
          } else {
            val = typeof val === "string" ? val.trim() : val;
          }

          extra_features_obj[trimmedKey] = val;
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
        setStatus({ type: "success", message: "Модель успішно оновлено!" });
      } else {
        const res = await ramApi.createModel(payload, token);
        setStatus({
          type: "success",
          message: res.message || "Модель успішно створено!",
        });
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

  const handleFeatureDefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true);
    setStatus(null);
    try {
      const payload: any = {
        feature_name: featureDefData.feature_name,
        display_type: featureDefData.display_type,
      };

      if (["select", "multiselect"].includes(featureDefData.display_type)) {
        payload.options = featureDefData.options
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (editingId)
        await ramApi.updateFeatureDefinition(editingId, payload, token);
      else await ramApi.createFeatureDefinition(payload, token);

      setStatus({ type: "success", message: "Характеристику збережено" });
      await loadData();
      resetForm();
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, type: TabType) => {
    if (!window.confirm("Ви дійсно хочете видалити цей запис?")) return;
    if (!token) return;
    try {
      if (type === "ram") await ramApi.deleteModel(id, token);
      else if (type === "manufacturer")
        await ramApi.deleteManufacturer(id, token);
      else if (type === "type") await ramApi.deleteMemoryType(id, token);
      else if (type === "formFactor") await ramApi.deleteFormFactor(id, token);
      else if (type === "feature")
        await ramApi.deleteFeatureDefinition(id, token);

      setStatus({ type: "success", message: "Запис успішно видалено!" });
      await loadData();
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Помилка видалення" });
    }
  };

  // Фільтрація моделей за пошуковим запитом
  const filteredModels = models.filter((m) =>
    `${m.model_name} ${m.manufacturer_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.pageTitle}>Панель адміністратора каталогу ОЗП</h2>

      <div className={styles.tabsContainer}>
        {(
          ["ram", "manufacturer", "type", "formFactor", "feature"] as TabType[]
        ).map((tab) => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setStatus(null);
              resetForm();
              setSearchQuery("");
            }}
          >
            {tab === "ram" && "Моделі ОЗП"}
            {tab === "manufacturer" && "Виробники"}
            {tab === "type" && "Стандарти пам'яті"}
            {tab === "formFactor" && "Формфактори"}
            {tab === "feature" && "Довідник характеристик"}
          </button>
        ))}
      </div>

      {status && (
        <div
          className={`${styles.statusMessage} ${status.type === "success" ? styles.statusSuccess : styles.statusError}`}
        >
          {status.message}
        </div>
      )}

      {/* --- ВКЛАДКА МОДЕЛЕЙ ОЗП --- */}
      {activeTab === "ram" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>
                {editingId ? "Редагування моделі ОЗП" : "Додавання нової ОЗП"}
              </h3>
            </div>
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
                    placeholder="напр. Fury Beast RGB"
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
                    placeholder="16"
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
                    placeholder="3200"
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
                    placeholder="16"
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
                      className={styles.previewImage}
                    />
                  )}
                </div>

                {/* ДИНАМІЧНІ ХАРАКТЕРИСТИКИ */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <div className={styles.featuresWrapper}>
                    <div className={styles.featuresHeader}>
                      <label className={styles.label} style={{ margin: 0 }}>
                        Додаткові характеристики
                      </label>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className={styles.addFeatureBtn}
                      >
                        + Додати параметр
                      </button>
                    </div>

                    {ramData.extraFeaturesList.map((item, index) => {
                      const def = featureDefs.find(
                        (d) => d.feature_name === item.key,
                      );
                      const displayType = def ? def.display_type : "text";

                      return (
                        <div key={index} className={styles.featureRow}>
                          <select
                            value={item.key}
                            onChange={(e) =>
                              handleFeatureChange(index, "key", e.target.value)
                            }
                            className={styles.select}
                            style={{ flex: 1 }}
                          >
                            <option value="" disabled>
                              Оберіть параметр
                            </option>
                            {featureDefs.map((d) => (
                              <option
                                key={d.feature_name}
                                value={d.feature_name}
                              >
                                {d.feature_name}
                              </option>
                            ))}
                          </select>

                          {displayType === "boolean" ? (
                            <label
                              className={styles.featureCheckboxLabel}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flex: 1,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(item.value)}
                                onChange={(e) =>
                                  handleFeatureChange(
                                    index,
                                    "value",
                                    e.target.checked,
                                  )
                                }
                                className={styles.featureCheckbox}
                              />
                              Наявність (Так/Є)
                            </label>
                          ) : displayType === "select" && def?.options ? (
                            <select
                              value={item.value}
                              onChange={(e) =>
                                handleFeatureChange(
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                              className={styles.select}
                              style={{ flex: 1 }}
                            >
                              <option value="" disabled>
                                Оберіть...
                              </option>
                              {def.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : displayType === "multiselect" && def?.options ? (
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                                padding: "8px",
                                border: "1px solid #334155",
                                borderRadius: "8px",
                              }}
                            >
                              {def.options.map((opt) => {
                                const isSelected = Array.isArray(item.value)
                                  ? item.value.includes(opt)
                                  : typeof item.value === "string" &&
                                    item.value.includes(opt);

                                return (
                                  <label
                                    key={opt}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "0.9rem",
                                      color: "#f8fafc",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) =>
                                        handleMultiselectChange(
                                          index,
                                          opt,
                                          e.target.checked,
                                        )
                                      }
                                    />
                                    {opt}
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Значення"
                              value={
                                Array.isArray(item.value)
                                  ? item.value.join(", ")
                                  : item.value
                              }
                              onChange={(e) =>
                                handleFeatureChange(
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                              className={styles.input}
                              style={{ flex: 1 }}
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className={styles.removeFeatureBtn}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Опис моделі</label>
                  <textarea
                    name="description"
                    value={ramData.description}
                    onChange={handleRamChange}
                    className={styles.textarea}
                    placeholder="Технічні особливості..."
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
                      : "Створити модель"}
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
            <div className={styles.cardHeader}>
              <h3>Список моделей ({filteredModels.length})</h3>
            </div>
            <input
              type="text"
              placeholder="Шукати за брендом або моделлю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchBox}
            />
            <div className={styles.tableContainer}>
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
                  {filteredModels.map((m) => (
                    <tr key={m.ram_id}>
                      <td>{m.manufacturer_name}</td>
                      <td>{m.model_name}</td>
                      <td>{m.capacity_gb} ГБ</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => {
                              setEditingId(m.ram_id);
                              const featuresList: ExtraFeaturePair[] = [];
                              if (m.extra_features) {
                                Object.entries(m.extra_features).forEach(
                                  ([k, v]) => {
                                    const displayValue = Array.isArray(v)
                                      ? v
                                      : isFeaturePresent(v)
                                        ? true
                                        : v;
                                    featuresList.push({
                                      key: k,
                                      value: displayValue,
                                    });
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ВКЛАДКА ВИРОБНИКІВ --- */}
      {activeTab === "manufacturer" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>{editingId ? "Редагувати виробника" : "Додати виробника"}</h3>
            </div>
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
                    className={styles.previewImage}
                  />
                )}
              </div>
              <div className={styles.formGroup}>
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
            <div className={styles.cardHeader}>
              <h3>Список виробників</h3>
            </div>
            <div className={styles.tableContainer}>
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
                        <div className={styles.actionButtons}>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ВКЛАДКА СТАНДАРТІВ ПАМ'ЯТІ --- */}
      {activeTab === "type" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>
                {editingId ? "Редагувати стандарт" : "Додати стандарт пам'яті"}
              </h3>
            </div>
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
              <div className={styles.formGroup}>
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
                    className={styles.previewImage}
                  />
                )}
              </div>
              <div className={styles.formGroup}>
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
            <div className={styles.cardHeader}>
              <h3>Список стандартів</h3>
            </div>
            <div className={styles.tableContainer}>
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
                        <div className={styles.actionButtons}>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ВКЛАДКА ФОРМФАКТОРІВ --- */}
      {activeTab === "formFactor" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>
                {editingId ? "Редагувати формфактор" : "Додати формфактор"}
              </h3>
            </div>
            <form onSubmit={handleFormFactorSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Назва формфактора (напр. DIMM) *
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
                  onChange={createFileUploadHandler(
                    setFormFactorData,
                    "image_url",
                  )}
                  className={styles.input}
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className={styles.previewImage}
                  />
                )}
              </div>
              <div className={styles.formGroup}>
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
            <div className={styles.cardHeader}>
              <h3>Список формфакторів</h3>
            </div>
            <div className={styles.tableContainer}>
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
                        <div className={styles.actionButtons}>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ВКЛАДКА ДОВІДНИКА ХАРАКТЕРИСТИК (НОВА) --- */}
      {activeTab === "feature" && (
        <div className={styles.splitLayout}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>
                {editingId
                  ? "Редагувати характеристику"
                  : "Додати характеристику до словника"}
              </h3>
            </div>
            <form onSubmit={handleFeatureDefSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Назва параметра (напр. Радіатор) *
                </label>
                <input
                  type="text"
                  name="feature_name"
                  value={featureDefData.feature_name}
                  onChange={handleFeatureDefChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Тип поля *</label>
                <select
                  name="display_type"
                  value={featureDefData.display_type}
                  onChange={handleFeatureDefChange}
                  required
                  className={styles.select}
                >
                  <option value="text">Текст (звичайний рядок)</option>
                  <option value="number">Число</option>
                  <option value="boolean">Логічний (Чекбокс: Є / Немає)</option>
                  <option value="select">
                    Випадаючий список (Один варіант)
                  </option>
                  <option value="multiselect">
                    Множинний вибір (Через кому)
                  </option>
                </select>
              </div>

              {["select", "multiselect"].includes(
                featureDefData.display_type,
              ) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Варіанти (через кому) *
                  </label>
                  <input
                    type="text"
                    name="options"
                    value={featureDefData.options}
                    onChange={handleFeatureDefChange}
                    placeholder="XMP, EXPO, DOCP"
                    required
                    className={styles.input}
                  />
                </div>
              )}

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
            <div className={styles.cardHeader}>
              <h3>Довідник ({featureDefs.length})</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Назва параметра</th>
                    <th>Тип</th>
                    <th>Опції</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {featureDefs.map((f) => (
                    <tr key={f.feature_id || f.feature_name}>
                      <td>{f.feature_name}</td>
                      <td>{f.display_type}</td>
                      <td>{f.options ? f.options.join(", ") : "-"}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => {
                              if (f.feature_id) setEditingId(f.feature_id);
                              setFeatureDefData({
                                feature_name: f.feature_name,
                                display_type: f.display_type,
                                options: f.options ? f.options.join(", ") : "",
                              });
                            }}
                            className={styles.editBtn}
                          >
                            Ред.
                          </button>
                          <button
                            onClick={() =>
                              f.feature_id &&
                              handleDelete(f.feature_id, "feature")
                            }
                            className={styles.deleteBtn}
                          >
                            Вид.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
