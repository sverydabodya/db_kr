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

export default function Catalog() {
  const [models, setModels] = useState<RamModel[]>([]);
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
  const [hasRgb, setHasRgb] = useState(false);

  // Завантаження даних з реального API (PostgreSQL / Redis / Elasticsearch)
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setLoading(true);
        // Якщо введено пошуковий запит, передаємо його (працює через Elasticsearch)
        const data = await ramApi.getModels({
          search: searchTerm.trim() !== "" ? searchTerm : undefined,
        });
        setModels(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження каталогу");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCatalogData();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Динамічні довідники з прийшовших даних
  const manufacturers: Manufacturer[] = useMemo(() => {
    const map = new Map();
    models.forEach((m) => {
      if (m.manufacturer_id && m.manufacturer_name) {
        map.set(m.manufacturer_id, {
          manufacturer_id: m.manufacturer_id,
          name: m.manufacturer_name,
        });
      }
    });
    return Array.from(map.values());
  }, [models]);

  const memoryTypes: MemoryType[] = useMemo(() => {
    const map = new Map();
    models.forEach((m) => {
      if (m.type_id && m.type_name) {
        map.set(m.type_id, {
          type_id: m.type_id,
          type_name: m.type_name,
          default_voltage: 1.1,
        });
      }
    });
    return Array.from(map.values());
  }, [models]);

  const formFactors: FormFactor[] = useMemo(() => {
    const map = new Map();
    models.forEach((m) => {
      if (m.form_factor_id && m.form_factor_name) {
        map.set(m.form_factor_id, {
          form_factor_id: m.form_factor_id,
          form_factor_name: m.form_factor_name,
        });
      }
    });
    return Array.from(map.values());
  }, [models]);

  const availableCapacities = useMemo(
    () =>
      Array.from(new Set(models.map((m) => m.capacity_gb))).sort(
        (a, b) => a - b,
      ),
    [models],
  );

  const availableFrequencies = useMemo(
    () =>
      Array.from(new Set(models.map((m) => m.frequency_mhz))).sort(
        (a, b) => a - b,
      ),
    [models],
  );

  const availableCas = useMemo(
    () =>
      Array.from(
        new Set(
          models
            .filter((m) => m.cas_latency != null)
            .map((m) => m.cas_latency as number),
        ),
      ).sort((a, b) => a - b),
    [models],
  );

  const toggleFilter = (
    currentSelection: number[],
    setSelection: React.Dispatch<React.SetStateAction<number[]>>,
    id: number,
  ) => {
    setSelection(
      currentSelection.includes(id)
        ? currentSelection.filter((item) => item !== id)
        : [...currentSelection, id],
    );
  };

  // Фронтенд-фільтрація додаткових параметрів
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
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
      const matchesRgb = !hasRgb || Boolean(model.extra_features?.has_rgb);

      return (
        matchesBrand &&
        matchesType &&
        matchesForm &&
        matchesCap &&
        matchesFreq &&
        matchesCas &&
        matchesRgb
      );
    });
  }, [
    models,
    selectedManufacturers,
    selectedTypes,
    selectedFormFactors,
    selectedCapacities,
    selectedFrequencies,
    selectedCas,
    hasRgb,
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
              placeholder="Пошук моделі (Elasticsearch)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

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
                    className={`${styles.pillButton} ${
                      selectedCapacities.includes(cap) ? styles.active : ""
                    }`}
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
                    className={`${styles.pillButton} ${
                      selectedFrequencies.includes(freq) ? styles.active : ""
                    }`}
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
                    className={`${styles.pillButton} ${
                      selectedCas.includes(cas) ? styles.active : ""
                    }`}
                  >
                    CL{cas}
                  </button>
                ))}
              </div>
            </div>
          </details>

          <details className={styles.filterDetails} open>
            <summary className={styles.filterSummary}>
              Особливості <ChevronIcon />
            </summary>
            <div className={styles.filterContent}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={hasRgb}
                  onChange={() => setHasRgb(!hasRgb)}
                />
                З RGB підсвічуванням
              </label>
            </div>
          </details>
        </aside>

        <div className={styles.contentArea}>
          {loading ? (
            <div className={styles.loading}>
              Завантаження каталогу з бази даних...
            </div>
          ) : (
            <>
              <div className={styles.gridContainer}>
                {filteredModels.map((model) => (
                  <div key={model.ram_id} className={styles.card}>
                    <h3 className={styles.cardTitle}>
                      {model.manufacturer_name} {model.model_name}
                    </h3>
                    <ul className={styles.cardList}>
                      <li>
                        <strong>Тип:</strong> {model.type_name} (
                        {model.form_factor_name})
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
                      {model.extra_features?.has_rgb && (
                        <li>
                          <strong>Підсвічування:</strong> RGB
                        </li>
                      )}
                    </ul>
                    <div className={styles.cardFooter}>
                      <span className={styles.price}>
                        {model.description || "Опис відсутній"}
                      </span>
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

              {filteredModels.length === 0 && (
                <div className={styles.noResults}>
                  За обраними фільтрами моделей не знайдено.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
