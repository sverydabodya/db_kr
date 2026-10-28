import { useState, useEffect } from "react";
import { ramApi } from "../api/ramApi";
import type { MemoryType } from "@ram-catalog/shared";
import styles from "./MemoryTypes.module.css";

export default function MemoryTypes() {
  const [memoryTypes, setMemoryTypes] = useState<MemoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemoryTypes = async () => {
      try {
        setLoading(true);
        // Отримуємо стандарти пам'яті напряму з їхньої таблиці через API
        const data = await ramApi.getMemoryTypes();

        setMemoryTypes(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження стандартів пам'яті");
      } finally {
        setLoading(false);
      }
    };

    fetchMemoryTypes();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        Завантаження довідника стандартів пам'яті...
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorBanner}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.pageTitle}>Довідник: Стандарти пам'яті</h2>

      <div className={styles.gridContainer}>
        {memoryTypes.map((type) => (
          <div key={type.type_id} className={styles.card}>
            
            {/* Уніфікований контейнер для зображення (схеми) */}
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
              {type.image_url ? (
                <img
                  src={type.image_url}
                  alt={`Схема ${type.type_name}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain" // Зберігає пропорції без розтягування
                  }}
                />
              ) : (
                <span style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center" }}>
                  Схема {type.type_name}
                </span>
              )}
            </div>

            <h3 className={styles.name}>{type.type_name}</h3>

            <div className={styles.voltageBadge}>
              <span>⚡</span> Базова напруга: {type.default_voltage} В
            </div>

            <p className={styles.description}>
              {type.description ||
                "Технічний опис стандарту пам'яті наразі відсутній у базі даних довідника."}
            </p>
          </div>
        ))}

        {memoryTypes.length === 0 && (
          <div className={styles.noResults}>
            Стандарти пам'яті не знайдені в базі даних.
          </div>
        )}
      </div>
    </div>
  );
}