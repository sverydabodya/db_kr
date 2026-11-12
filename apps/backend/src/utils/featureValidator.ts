import { pool } from "../config/db"; // Ваш файл підключення до БД

export const sanitizeExtraFeatures = async (
  rawFeatures: any,
): Promise<Record<string, any>> => {
  if (!rawFeatures || typeof rawFeatures !== "object") return {};

  // Отримуємо довідник з БД
  const { rows } = await pool.query(
    "SELECT feature_name, display_type FROM feature_definitions",
  );
  const typeMap = new Map(
    rows.map((row) => [row.feature_name, row.display_type]),
  );

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(rawFeatures)) {
    const trimmedKey = key.trim();
    if (!trimmedKey || value === null || value === "") continue;

    const displayType = typeMap.get(trimmedKey) || "text"; // За замовчуванням текст

    if (displayType === "boolean") {
      // Суворо приводимо до true / false
      sanitized[trimmedKey] =
        value === true || value === "true" || value === "Є";
    } else if (displayType === "multiselect") {
      // Робимо масив рядків
      if (Array.isArray(value)) sanitized[trimmedKey] = value.map(String);
      else if (typeof value === "string")
        sanitized[trimmedKey] = value.split(",").map((v) => v.trim());
    } else {
      // Для 'text' або 'select' залишаємо як рядок
      sanitized[trimmedKey] = String(value).trim();
    }
  }

  return sanitized;
};
