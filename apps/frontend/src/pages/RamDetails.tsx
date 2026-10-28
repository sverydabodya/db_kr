import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ramApi } from "../api/ramApi";
import type { RamModel } from "@ram-catalog/shared";
import styles from "./RamDetails.module.css";

// Словник для красивого виведення ключів extra_features
const featureLabels: Record<string, string> = {
  has_rgb: "RGB підсвічування",
  ecc: "Підтримка ECC",
  heatsink: "Охолодження (Радіатор)",
  tested_voltage: "Тестова напруга",
  profiles: "Профілі розгону",
};

export default function RamDetails() {
  const { id } = useParams<{ id: string }>();
  const [model, setModel] = useState<RamModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModelDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await ramApi.getModelById(Number(id));
        setModel(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Не вдалося завантажити інформацію про модель");
      } finally {
        setLoading(false);
      }
    };

    fetchModelDetails();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loading}>Завантаження характеристик моделі...</div>
    );
  }

  if (error || !model) {
    return (
      <div className={styles.notFound}>
        <p>
          {error || "На жаль, таку модель оперативної пам'яті не знайдено."}
        </p>
        <Link to="/" className={styles.backLink}>
          ← Повернутися до каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.detailsContainer}>
      <Link to="/" className={styles.backLink}>
        ← Повернутися до каталогу
      </Link>

      <div className={styles.contentWrapper}>
        <div className={styles.imageSection}>
          {model.image_url ? (
            <img
              src={model.image_url}
              alt={model.model_name}
              style={{
                width: "100%",
                borderRadius: "12px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className={styles.imagePlaceholder}>Фото ОЗП відсутнє</div>
          )}
        </div>

        <div className={styles.infoSection}>
          <h1 className={styles.title}>
            {model.manufacturer_name} {model.model_name}
          </h1>

          <h3 className={styles.specsTitle}>Характеристики</h3>
          <table className={styles.specsTable}>
            <tbody>
              <tr>
                <td>Виробник</td>
                <td>{model.manufacturer_name || "Невідомо"}</td>
              </tr>
              <tr>
                <td>Тип пам'яті</td>
                <td>{model.type_name || "Невідомо"}</td>
              </tr>
              <tr>
                <td>Формфактор</td>
                <td>{model.form_factor_name || "Невідомо"}</td>
              </tr>
              <tr>
                <td>Обсяг модуля</td>
                <td>{model.capacity_gb} ГБ</td>
              </tr>
              <tr>
                <td>Ефективна частота</td>
                <td>{model.frequency_mhz} МГц</td>
              </tr>
              {model.cas_latency != null && (
                <tr>
                  <td>CAS Latency (Таймінги)</td>
                  <td>CL{model.cas_latency}</td>
                </tr>
              )}

              {/* Динамічний вивід усіх додаткових параметрів з extra_features */}
              {model.extra_features &&
                Object.entries(model.extra_features).map(([key, value]) => {
                  // Форматуємо значення для гарного виведення
                  let displayVal = String(value);
                  if (value === true) displayVal = "Так";
                  if (value === false) displayVal = "Ні";
                  if (Array.isArray(value)) displayVal = value.join(", ");

                  return (
                    <tr key={key}>
                      <td>{featureLabels[key] || key}</td>
                      <td>{displayVal}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {model.description && (
            <div className={styles.description}>
              <h3 className={styles.specsTitle}>Опис</h3>
              <p>{model.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
