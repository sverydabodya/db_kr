import { useState, useEffect } from "react";
import { ramApi } from "../api/ramApi";
import type { FormFactor } from "@ram-catalog/shared";
import styles from "./FormFactors.module.css";

export default function FormFactors() {
  const [formFactors, setFormFactors] = useState<FormFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormFactors = async () => {
      try {
        setLoading(true);
        // Отримуємо формфактори напряму з таблиці через API
        const data = await ramApi.getFormFactors();

        setFormFactors(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження формфакторів");
      } finally {
        setLoading(false);
      }
    };

    fetchFormFactors();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        Завантаження довідника формфакторів...
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorBanner}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.pageTitle}>Довідник: Формфактори</h2>

      <div className={styles.gridContainer}>
        {formFactors.map((formFactor) => (
          <div key={formFactor.form_factor_id} className={styles.card}>
            
            {/* Уніфікований контейнер для зображення (креслення) */}
            <div style={{
              width: "100%", 
              height: "160px", 
              marginBottom: "16px", 
              backgroundColor: "#0f172a", 
              borderRadius: "8px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              overflow: "hidden",
              padding: "16px"
            }}>
              {formFactor.image_url ? (
                <img
                  src={formFactor.image_url}
                  alt={`Креслення ${formFactor.form_factor_name}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain" // Зберігає пропорції без розтягування
                  }}
                />
              ) : (
                <span style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center" }}>
                  Креслення {formFactor.form_factor_name}
                </span>
              )}
            </div>

            <h3 className={styles.name}>
              <span className={styles.icon}>📏</span>{" "}
              {formFactor.form_factor_name}
            </h3>

            <p className={styles.description}>
              {formFactor.description ||
                "Опис габаритів та розпіновки даного формфактора наразі відсутній у базі."}
            </p>
          </div>
        ))}

        {formFactors.length === 0 && (
          <div className={styles.noResults}>
            Формфактори не знайдені в базі даних.
          </div>
        )}
      </div>
    </div>
  );
}