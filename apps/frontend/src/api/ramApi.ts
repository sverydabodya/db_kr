import type {
  RamModel,
  Manufacturer,
  MemoryType,
  FormFactor,
} from "@ram-catalog/shared"; 

const API_PREFIX = "/api";

export const ramApi = {
  getModels: async (filters?: {
    manufacturer_id?: number;
    type_id?: number;
    form_factor_id?: number;
    min_capacity?: number;
    min_frequency?: number;
    has_rgb?: boolean;
    profile?: string;
    search?: string;
  }): Promise<RamModel[]> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_PREFIX}/ram${queryStr}`);

    if (!response.ok) {
      throw new Error("Не вдалося завантажити каталог моделей ОЗП");
    }

    return response.json();
  },

  getModelById: async (id: number): Promise<RamModel> => {
    const response = await fetch(`${API_PREFIX}/ram/${id}`);
    if (!response.ok) {
      throw new Error("Модель ОЗП не знайдено");
    }
    return response.json();
  },

  createModel: async (newModel: Omit<RamModel, "ram_id">, token: string) => {
    const response = await fetch(`${API_PREFIX}/ram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newModel),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Помилка при створенні моделі ОЗП");
    }

    return { success: true, message: "Модель ОЗП успішно додано!", data };
  },

  createManufacturer: async (
    newMan: Omit<Manufacturer, "manufacturer_id">,
    token: string,
  ) => {
    const response = await fetch(`${API_PREFIX}/manufacturers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newMan),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Помилка при додаванні виробника");
    return {
      success: true,
      message: "Виробника успішно додано в довідник!",
      data,
    };
  },

  createMemoryType: async (
    newType: Omit<MemoryType, "type_id">,
    token: string,
  ) => {
    const response = await fetch(`${API_PREFIX}/memory-types`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newType),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Помилка при створенні стандарту пам'яті");
    return {
      success: true,
      message: "Стандарт пам'яті успішно створено!",
      data,
    };
  },

  createFormFactor: async (
    newForm: Omit<FormFactor, "form_factor_id">,
    token: string,
  ) => {
    const response = await fetch(`${API_PREFIX}/form-factors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newForm),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Помилка при додаванні формфактора");
    return { success: true, message: "Формфактор успішно додано!", data };
  },
};
