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

// Словник для перекладу системних ключів у красиві назви
const featureTranslations: Record<string, string> = {
  has_rgb: "RGB підсвічування",
  ecc: "Підтримка ECC",
};

export default function Catalog() {
  const [allModels, setAllModels] = useState<RamModel[]>([]);
  const [displayModels, setDisplayModels] = useState<RamModel[]>([]);

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

  // Нові динамічні стейти для extra_features
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedHeatsinks, setSelectedHeatsinks] = useState<string[]>([]);
  const [selectedVoltages, setSelectedVoltages] = useState<string[]>([]);
  const [selectedBoolFeatures, setSelectedBoolFeatures] = useState<string[]>(
    [],
  );

  // Стейти для довідників (з таблиць БД)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [memoryTypes, setMemoryTypes] = useState<MemoryType[]>([]);
  const [formFactors, setFormFactors] = useState<FormFactor[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Завантажуємо всі дані паралельно для максимальної швидкості
        const [modelsData, mfrsData, typesData, formsData] = await Promise.all([
          ramApi.getModels(),
          ramApi.getManufacturers(),
          ramApi.getMemoryTypes(),
          ramApi.getFormFactors(),
        ]);

        setAllModels(modelsData);
        setManufacturers(mfrsData);
        setMemoryTypes(typesData);
        setFormFactors(formsData);

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

  // --- ДИНАМІЧНІ ФІЛЬТРИ (залишаються з моделей, оскільки у них немає своїх таблиць) ---
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

  const availableProfiles = useMemo(() => {
    const items = new Set<string>();
    allModels.forEach((m) => {
      let profs = m.extra_features?.profiles;
      if (typeof profs === "string") {
        try {
          profs = JSON.parse(profs);
        } catch (e) {}
      }
      if (Array.isArray(profs)) profs.forEach((p) => items.add(p));
    });
    return Array.from(items).sort();
  }, [allModels]);

  const availableHeatsinks = useMemo(() => {
    const items = new Set<string>();
    allModels.forEach((m) => {
      if (m.extra_features?.heatsink) items.add(m.extra_features.heatsink);
    });
    return Array.from(items).sort();
  }, [allModels]);

  const availableVoltages = useMemo(() => {
    const items = new Set<string>();
    allModels.forEach((m) => {
      if (m.extra_features?.tested_voltage)
        items.add(String(m.extra_features.tested_voltage));
    });
    return Array.from(items).sort();
  }, [allModels]);

  const availableBoolFeatures = useMemo(() => {
    const items = new Set<string>();
    allModels.forEach((m) => {
      if (m.extra_features) {
        Object.entries(m.extra_features).forEach(([k, v]) => {
          if (v === true || v === "true" || v === false || v === "false")
            items.add(k);
        });
      }
    });
    return Array.from(items).sort();
  }, [allModels]);

  // Універсальна функція перемикання фільтрів
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

  // --- ФІЛЬТРАЦІЯ ---
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

      const matchesHeatsink =
        selectedHeatsinks.length === 0 ||
        selectedHeatsinks.includes(model.extra_features?.heatsink);
      const matchesVoltage =
        selectedVoltages.length === 0 ||
        selectedVoltages.includes(String(model.extra_features?.tested_voltage));

      const matchesProfiles =
        selectedProfiles.length === 0 ||
        (() => {
          let profs = model.extra_features?.profiles;
          if (typeof profs === "string")
            try {
              profs = JSON.parse(profs);
            } catch (e) {}
          return (
            Array.isArray(profs) &&
            selectedProfiles.some((sp) => profs.includes(sp))
          );
        })();

      const matchesBools = selectedBoolFeatures.every((feat) => {
        const val = model.extra_features?.[feat];
        return val === true || val === "true";
      });

      return (
        matchesBrand &&
        matchesType &&
        matchesForm &&
        matchesCap &&
        matchesFreq &&
        matchesCas &&
        matchesHeatsink &&
        matchesVoltage &&
        matchesProfiles &&
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
    selectedHeatsinks,
    selectedVoltages,
    selectedProfiles,
    selectedBoolFeatures,
  ]);

  // --- СКИНУТИ ВСІ ФІЛЬТРИ ---
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedManufacturers([]);
    setSelectedTypes([]);
    setSelectedFormFactors([]);
    setSelectedCapacities([]);
    setSelectedFrequencies([]);
    setSelectedCas([]);
  };

  // Перевірка, чи є хоча б один активний фільтр (щоб показувати кнопку за потреби)
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      selectedManufacturers.length > 0 ||
      selectedTypes.length > 0 ||
      selectedFormFactors.length > 0 ||
      selectedCapacities.length > 0 ||
      selectedFrequencies.length > 0 ||
      selectedCas.length > 0
    );
  }, [
    searchTerm,
    selectedManufacturers,
    selectedTypes,
    selectedFormFactors,
    selectedCapacities,
    selectedFrequencies,
    selectedCas,
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
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#475569")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#334155")
                }
              >
                Скинути фільтри ✕
              </button>
            </div>
          )}

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

          {availableProfiles.length > 0 && (
            <details className={styles.filterDetails} open>
              <summary className={styles.filterSummary}>
                Профілі розгону <ChevronIcon />
              </summary>
              <div className={styles.filterContent}>
                {availableProfiles.map((profile) => (
                  <label key={profile} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={selectedProfiles.includes(profile)}
                      onChange={() =>
                        toggleFilter(
                          selectedProfiles,
                          setSelectedProfiles,
                          profile,
                        )
                      }
                    />
                    {profile}
                  </label>
                ))}
              </div>
            </details>
          )}

          {availableHeatsinks.length > 0 && (
            <details className={styles.filterDetails} open>
              <summary className={styles.filterSummary}>
                Охолодження (Радіатор) <ChevronIcon />
              </summary>
              <div className={styles.filterContent}>
                {availableHeatsinks.map((heatsink) => (
                  <label key={heatsink} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={selectedHeatsinks.includes(heatsink)}
                      onChange={() =>
                        toggleFilter(
                          selectedHeatsinks,
                          setSelectedHeatsinks,
                          heatsink,
                        )
                      }
                    />
                    {heatsink}
                  </label>
                ))}
              </div>
            </details>
          )}

          {availableVoltages.length > 0 && (
            <details className={styles.filterDetails} open>
              <summary className={styles.filterSummary}>
                Напруга <ChevronIcon />
              </summary>
              <div className={styles.filterContent}>
                <div className={styles.pillGrid}>
                  {availableVoltages.map((volt) => (
                    <button
                      key={volt}
                      onClick={() =>
                        toggleFilter(
                          selectedVoltages,
                          setSelectedVoltages,
                          volt,
                        )
                      }
                      className={`${styles.pillButton} ${selectedVoltages.includes(volt) ? styles.active : ""}`}
                    >
                      {volt} В
                    </button>
                  ))}
                </div>
              </div>
            </details>
          )}

          {availableBoolFeatures.length > 0 && (
            <details className={styles.filterDetails} open>
              <summary className={styles.filterSummary}>
                Особливості <ChevronIcon />
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
                    {featureTranslations[feat] || feat}
                  </label>
                ))}
              </div>
            </details>
          )}
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
                pointerEvents: loading ? "none" : "auto",
              }}
            >
              <div className={styles.gridContainer}>
                {filteredModels.map((model) => (
                  <div key={model.ram_id} className={styles.card}>
                    {/* Контейнер для зображення з фіксованою висотою та вирівнюванням */}
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
                            objectFit: "contain", // Зберігає пропорції, не обрізає і не розтягує
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
                      {model.extra_features?.has_rgb === true && (
                        <li>
                          <strong>Підсвічування:</strong> RGB
                        </li>
                      )}
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
