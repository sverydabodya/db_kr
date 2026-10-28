import { useState, useEffect } from "react";
import { ramApi } from "../api/ramApi";
import type { Manufacturer } from "@ram-catalog/shared";
import styles from "./Manufacturers.module.css";

export default function Manufacturers() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        setLoading(true);
        // Викликаємо готовий метод з ramApi, який забирає чисті дані з таблиці виробників
        const data = await ramApi.getManufacturers();

        setManufacturers(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження виробників");
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturers();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>Завантаження довідника виробників...</div>
    );
  }

  if (error) {
    return <div className={styles.errorBanner}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.pageTitle}>Довідник виробників</h2>

      <div className={styles.gridContainer}>
        {manufacturers.map((manufacturer) => (
          <div key={manufacturer.manufacturer_id} className={styles.card}>
            
            {/* Контейнер для логотипа з фіксованою висотою та вирівнюванням */}
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
              {manufacturer.logo_url ? (
                <img
                  src={manufacturer.logo_url}
                  alt={`Логотип ${manufacturer.name}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain" // Зберігає пропорції логотипа
                  }}
                />
              ) : (
                <span style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center" }}>
                  {manufacturer.name} Logo
                </span>
              )}
            </div>

            <h3 className={styles.name}>{manufacturer.name}</h3>

            {manufacturer.country && (
              <div className={styles.country}>
                <span>🌍</span> {manufacturer.country}
              </div>
            )}

            <p className={styles.description}>
              {manufacturer.description ||
                "Опис компанії наразі відсутній у базі даних довідника."}
            </p>

            {manufacturer.website ? (
              <a
                href={manufacturer.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.websiteLink}
              >
                Офіційний сайт
              </a>
            ) : (
              <span className={styles.disabledLink}>Сайт не вказано</span>
            )}
          </div>
        ))}

        {manufacturers.length === 0 && (
          <div className={styles.noResults}>
            Виробників не знайдено в базі даних.
          </div>
        )}
      </div>
    </div>
  );
}