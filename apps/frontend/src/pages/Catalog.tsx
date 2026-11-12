import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ramApi } from "../api/ramApi";
import type {
  RamModel,
  Manufacturer,
  MemoryType,
  FormFactor,
} from "@ram-catalog/shared";
import styles from "./Catalog.module.css";

const ChevronIcon = () => (
  <svg className={styles.arrowIcon} width="20" height="20" viewBox="0 0 24 24">
    <path d="M6.293 9.293a1 1 0 0 1 1.414 0L12 13.586l4.293-4.293a1 1 0 1 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-5-5a1 1 0 0 1 0-1.414z" />
  </svg>
);

export interface FeatureDefinition {
  feature_id?: number;
  feature_name: string;
  display_type: "boolean" | "text" | "select" | "multiselect" | "number";
  options?: string[];
}

export default function Catalog() {
  const [allModels, setAllModels] = useState<RamModel[]>([]);
  const [displayModels, setDisplayModels] = useState<RamModel[]>([]);
  const [featureDefs, setFeatureDefs] = useState<FeatureDefinition[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManufacturers, setSelectedManufacturers] = useState<number[]>(
    [],
  );
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [selectedFormFactors, setSelectedFormFactors] = useState<number[]>([]);
  const [selectedCapacities, setSelectedCapacities] = useState<number[]>([]);
  const [selectedFrequencies, setSelectedFrequencies] = useState<number[]>([]);
  const [selectedCas, setSelectedCas] = useState<number[]>([]);

  // Для значень з множинним вибором (селекти, тексти, числа)
  const [selectedExtraFeatures, setSelectedExtraFeatures] = useState<
    Record<string, string[]>
  >({});

  // Для булевих характеристик (чекбокси "наявності")
  const [selectedBoolFeatures, setSelectedBoolFeatures] = useState<string[]>(
    [],
  );

  // Стейти для довідників
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [memoryTypes, setMemoryTypes] = useState<MemoryType[]>([]);
  const [formFactors, setFormFactors] = useState<FormFactor[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [modelsData, mfrsData, typesData, formsData, defsData] =
          await Promise.all([
            ramApi.getModels(),
            ramApi.getManufacturers(),
            ramApi.getMemoryTypes(),
            ramApi.getFormFactors(),
            ramApi.getFeatureDefinitions().catch(() => []), // Якщо довідник ще не готовий, повертаємо пустий масив
          ]);

        setAllModels(modelsData);
        setManufacturers(mfrsData);
        setMemoryTypes(typesData);
        setFormFactors(formsData);
        setFeatureDefs(defsData);

        if (searchTerm.trim() === "") {
          setDisplayModels(modelsData);
        }
      } catch (err: any) {
        setError(err.message || "Помилка завантаження каталогу");
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        setLoading(true);
        if (searchTerm.trim() === "") {
          setDisplayModels(allModels);
        } else {
          const data = await ramApi.getModels({ search: searchTerm.trim() });
          setDisplayModels(data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || "Помилка пошуку");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      if (allModels.length > 0) {
        fetchSearchData();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, allModels]);

  // --- БАЗОВІ ФІЛЬТРИ ---
  const availableCapacities = useMemo(
    () =>
      Array.from(new Set(allModels.map((m) => m.capacity_gb))).sort(
        (a, b) => a - b,
      ),
    [allModels],
  );

  const availableFrequencies = useMemo(
    () =>
      Array.from(new Set(allModels.map((m) => m.frequency_mhz))).sort(
        (a, b) => a - b,
      ),
    [allModels],
  );

  const availableCas = useMemo(
    () =>
      Array.from(
        new Set(
          allModels
            .filter((m) => m.cas_latency != null)
            .map((m) => m.cas_latency as number),
        ),
      ).sort((a, b) => a - b),
    [allModels],
  );

  // --- ЗБИРАННЯ БУЛЕВИХ ХАРАКТЕРИСТИК (на основі довідника featureDefs) ---
  const availableBoolFeatures = useMemo(() => {
    const keysSet = new Set<string>();
    const boolDefNames = featureDefs
      .filter((d) => d.display_type === "boolean")
      .map((d) => d.feature_name);

    allModels.forEach((model) => {
      if (model.extra_features && typeof model.extra_features === "object") {
        Object.entries(model.extra_features).forEach(([key, val]) => {
          // Враховуємо старий формат ("Є") і новий (true), або якщо характеристика є булевою в довіднику
          if (
            val === "Є" ||
            val === true ||
            (boolDefNames.includes(key) && val)
          ) {
            keysSet.add(key);
          }
        });
      }
    });
    return Array.from(keysSet).sort();
  }, [allModels, featureDefs]);

  // --- ЗБИРАННЯ ІНШИХ ДИНАМІЧНИХ ЗНАЧЕНЬ ---
  const dynamicFeatureMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    const boolDefNames = featureDefs
      .filter((d) => d.display_type === "boolean")
      .map((d) => d.feature_name);

    allModels.forEach((model) => {
      if (model.extra_features && typeof model.extra_features === "object") {
        Object.entries(model.extra_features).forEach(([key, val]) => {
          // Пропускаємо булеві значення, порожні значення та false
          if (
            val === "Є" ||
            val === true ||
            val === false ||
            boolDefNames.includes(key) ||
            val === null ||
            val === undefined ||
            val === ""
          ) {
            return;
          }

          if (!map[key]) {
            map[key] = new Set();
          }

          if (Array.isArray(val)) {
            val.forEach((item) => {
              if (item != null) map[key].add(String(item));
            });
          } else {
            map[key].add(String(val));
          }
        });
      }
    });

    const result: Record<string, string[]> = {};
    Object.keys(map).forEach((key) => {
      const arr = Array.from(map[key]).sort();
      if (arr.length > 0) {
        result[key] = arr;
      }
    });

    return result;
  }, [allModels, featureDefs]);

  // --- ОБРОБНИКИ КЛІКІВ ---
  const toggleFilter = <T,>(
    currentSelection: T[],
    setSelection: React.Dispatch<React.SetStateAction<T[]>>,
    value: T,
  ) => {
    setSelection(
      currentSelection.includes(value)
        ? currentSelection.filter((item) => item !== value)
        : [...currentSelection, value],
    );
  };

  const toggleExtraFeature = (featureKey: string, value: string) => {
    setSelectedExtraFeatures((prev) => {
      const currentList = prev[featureKey] || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];

      if (updatedList.length === 0) {
        const copy = { ...prev };
        delete copy[featureKey];
        return copy;
      }

      return { ...prev, [featureKey]: updatedList };
    });
  };

  // --- ФІЛЬТРАЦІЯ МОДЕЛЕЙ ---
  const filteredModels = useMemo(() => {
    return displayModels.filter((model) => {
      const matchesBrand =
        selectedManufacturers.length === 0 ||
        selectedManufacturers.includes(model.manufacturer_id);
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(model.type_id);
      const matchesForm =
        selectedFormFactors.length === 0 ||
        selectedFormFactors.includes(model.form_factor_id);
      const matchesCap =
        selectedCapacities.length === 0 ||
        selectedCapacities.includes(model.capacity_gb);
      const matchesFreq =
        selectedFrequencies.length === 0 ||
        selectedFrequencies.includes(model.frequency_mhz);
      const matchesCas =
        selectedCas.length === 0 ||
        (model.cas_latency != null && selectedCas.includes(model.cas_latency));

      // Динамічні фільтри (мультиселект/текст)
      const matchesExtra = Object.entries(selectedExtraFeatures).every(
        ([key, selectedValues]) => {
          if (selectedValues.length === 0) return true;
          const modelVal = model.extra_features?.[key];
          if (modelVal === undefined || modelVal === null || modelVal === false)
            return false;

          if (Array.isArray(modelVal)) {
            return selectedValues.some((sv) =>
              modelVal.map(String).includes(sv),
            );
          }
          return selectedValues.includes(String(modelVal));
        },
      );

      // Булеві характеристики (чекбокси)
      const matchesBools = selectedBoolFeatures.every((feat) => {
        const val = model.extra_features?.[feat];
        return val === "Є" || val === true || val === "Так";
      });

      return (
        matchesBrand &&
        matchesType &&
        matchesForm &&
        matchesCap &&
        matchesFreq &&
        matchesCas &&
        matchesExtra &&
        matchesBools
      );
    });
  }, [
    displayModels,
    selectedManufacturers,
    selectedTypes,
    selectedFormFactors,
    selectedCapacities,
    selectedFrequencies,
    selectedCas,
    selectedExtraFeatures,
    selectedBoolFeatures,
  ]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedManufacturers([]);
    setSelectedTypes([]);
    setSelectedFormFactors([]);
    setSelectedCapacities([]);
    setSelectedFrequencies([]);
    setSelectedCas([]);
    setSelectedExtraFeatures({});
    setSelectedBoolFeatures([]);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      selectedManufacturers.length > 0 ||
      selectedTypes.length > 0 ||
      selectedFormFactors.length > 0 ||
      selectedCapacities.length > 0 ||
      selectedFrequencies.length > 0 ||
      selectedCas.length > 0 ||
      Object.keys(selectedExtraFeatures).length > 0 ||
      selectedBoolFeatures.length > 0
    );
  }, [
    searchTerm,
    selectedManufacturers,
    selectedTypes,
    selectedFormFactors,
    selectedCapacities,
    selectedFrequencies,
    selectedCas,
    selectedExtraFeatures,
    selectedBoolFeatures,
  ]);

  return (
    <div>
      <h2 className={styles.pageTitle}>Каталог оперативної пам'яті</h2>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.catalogLayout}>
        <aside className={styles.filtersPanel}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Пошук моделі"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {hasActiveFilters && (
            <div
              style={{
                padding: "0 20px 16px 20px",
                borderBottom: "1px solid #334155",
              }}
            >
              <button
                onClick={handleResetFilters}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "#334155",
                  color: "#f8fafc",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Скинути фільтри ✕
              </button>
            </div>
          )}

          {/* Бренд */}
          <details className={styles.filterDetails} open>
            <summary className={styles.filterSummary}>
              Бренд <ChevronIcon />
            </summary>
            <div className={styles.filterContent}>
              {manufacturers.map((m) => (
                <label key={m.manufacturer_id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={selectedManufacturers.includes(m.manufacturer_id)}
                    onChange={() =>
                      toggleFilter(
                        selectedManufacturers,
                        setSelectedManufacturers,
                        m.manufacturer_id,
                      )
                    }
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </details>

          {/* Обсяг пам'яті */}
          <details className={styles.filterDetails} open>
            <summary className={styles.filterSummary}>
              Обсяг пам'яті <ChevronIcon />
            </summary>
            <div className={styles.filterContent}>
              <div className={styles.pillGrid}>
                {availableCapacities.map((cap) => (
                  <button
                    key={cap}
                    onClick={() =>
                      toggleFilter(
                        selectedCapacities,
                        setSelectedCapacities,
                        cap,
                      )
                    }
                    className={`${styles.pillButton} ${selectedCapacities.includes(cap) ? styles.active : ""}`}
                  >
                    {cap} ГБ
                  </button>
                ))}
              </div>
            </div>
          </details>

          {/* Частота */}
          <details className={styles.filterDetails} open>
            <summary className={styles.filterSummary}>
              Частота, МГц <ChevronIcon />
            </summary>
            <div className={styles.filterContent}>
              <div className={styles.pillGrid}>
                {availableFrequencies.map((freq) => (
                  <button
                    key={freq}
                    onClick={() =>
                      toggleFilter(
                        selectedFrequencies,
                        setSelectedFrequencies,
                        freq,
                      )
                    }
                    className={`${styles.pillButton} ${selectedFrequencies.includes(freq) ? styles.active : ""}`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </details>

          {/* Тип пам'яті */}
          <details className={styles.filterDetails} open>
            <summary className={styles.filterSummary}>
              Тип пам'яті <ChevronIcon />
            </summary>
            <div className={styles.filterContent}>
              {memoryTypes.map((t) => (
                <label key={t.type_id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={selectedTypes.includes(t.type_id)}
                    onChange={() =>
                      toggleFilter(selectedTypes, setSelectedTypes, t.type_id)
                    }
                  />
                  {t.type_name}
                </label>
              ))}
            </div>
          </details>

          {/* Формфактор */}
          <details className={styles.filterDetails} open>
            <summary className={styles.filterSummary}>
              Формфактор <ChevronIcon />
            </summary>
            <div className={styles.filterContent}>
              {formFactors.map((f) => (
                <label key={f.form_factor_id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={selectedFormFactors.includes(f.form_factor_id)}
                    onChange={() =>
                      toggleFilter(
                        selectedFormFactors,
                        setSelectedFormFactors,
                        f.form_factor_id,
                      )
                    }
                  />
                  {f.form_factor_name}
                </label>
              ))}
            </div>
          </details>

          {/* CAS Latency */}
          {availableCas.length > 0 && (
            <details className={styles.filterDetails} open>
              <summary className={styles.filterSummary}>
                CAS Latency <ChevronIcon />
              </summary>
              <div className={styles.filterContent}>
                <div className={styles.pillGrid}>
                  {availableCas.map((cas) => (
                    <button
                      key={cas}
                      onClick={() =>
                        toggleFilter(selectedCas, setSelectedCas, cas)
                      }
                      className={`${styles.pillButton} ${selectedCas.includes(cas) ? styles.active : ""}`}
                    >
                      CL{cas}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          )}

          {/* --- БЛОК ОПЦІЙНИХ ХАРАКТЕРИСТИК (Булеві / Чекбокси) --- */}
          {availableBoolFeatures.length > 0 && (
            <details className={styles.filterDetails} open>
              <summary className={styles.filterSummary}>
                Додаткові характеристики <ChevronIcon />
              </summary>
              <div className={styles.filterContent}>
                {availableBoolFeatures.map((feat) => (
                  <label key={feat} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={selectedBoolFeatures.includes(feat)}
                      onChange={() =>
                        toggleFilter(
                          selectedBoolFeatures,
                          setSelectedBoolFeatures,
                          feat,
                        )
                      }
                    />
                    {feat}
                  </label>
                ))}
              </div>
            </details>
          )}

          {/* --- ІНШІ ДИНАМІЧНІ ФІЛЬТРИ (Профілі, напруга, таймінги тощо) --- */}
          {Object.entries(dynamicFeatureMap).map(([key, values]) => {
            const selectedArr = selectedExtraFeatures[key] || [];

            return (
              <details key={key} className={styles.filterDetails} open>
                <summary className={styles.filterSummary}>
                  {key} <ChevronIcon />
                </summary>
                <div className={styles.filterContent}>
                  <div className={styles.pillGrid}>
                    {values.map((val) => (
                      <button
                        key={val}
                        onClick={() => toggleExtraFeature(key, val)}
                        className={`${styles.pillButton} ${selectedArr.includes(val) ? styles.active : ""}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </aside>

        <div className={styles.contentArea}>
          {loading && displayModels.length === 0 ? (
            <div className={styles.loading}>
              Завантаження каталогу з бази даних...
            </div>
          ) : (
            <div
              style={{
                opacity: loading ? 0.5 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              <div className={styles.gridContainer}>
                {filteredModels.map((model) => (
                  <div key={model.ram_id} className={styles.card}>
                    <div
                      style={{
                        width: "100%",
                        height: "160px",
                        marginBottom: "16px",
                        backgroundColor: "#0f172a",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: "8px",
                      }}
                    >
                      {model.image_url ? (
                        <img
                          src={model.image_url}
                          alt={`${model.manufacturer_name} ${model.model_name}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                          Немає фото
                        </span>
                      )}
                    </div>

                    <h3 className={styles.cardTitle}>
                      {model.manufacturer_name} {model.model_name}
                    </h3>
                    <ul className={styles.cardList}>
                      <li>
                        <strong>Тип:</strong> {model.type_name}
                      </li>
                      <li>
                        <strong>Формфактор:</strong> {model.form_factor_name}
                      </li>
                      <li>
                        <strong>Обсяг:</strong> {model.capacity_gb} ГБ
                      </li>
                      <li>
                        <strong>Частота:</strong> {model.frequency_mhz} МГц
                      </li>
                      {model.cas_latency != null && (
                        <li>
                          <strong>Таймінги:</strong> CL{model.cas_latency}
                        </li>
                      )}

                      {/* Виведення до 3 додаткових характеристик з бази */}
                      {model.extra_features &&
                        Object.entries(model.extra_features)
                          .filter(
                            ([_, v]) =>
                              v !== null &&
                              v !== undefined &&
                              v !== "" &&
                              v !== false,
                          )
                          .slice(0, 3)
                          .map(([k, v]) => (
                            <li key={k}>
                              <strong>{k}:</strong>{" "}
                              {v === "Є" || v === true
                                ? "Так"
                                : Array.isArray(v)
                                  ? v.join(", ")
                                  : String(v)}
                            </li>
                          ))}
                    </ul>
                    <div className={styles.cardFooter}>
                      <Link
                        to={`/ram/${model.ram_id}`}
                        className={styles.detailsButton}
                        style={{ textDecoration: "none", textAlign: "center" }}
                      >
                        Детальніше
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {filteredModels.length === 0 && !loading && (
                <div className={styles.noResults}>
                  За обраними фільтрами моделей не знайдено.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
