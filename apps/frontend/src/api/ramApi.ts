import type {
  RamModel,
  Manufacturer,
  MemoryType,
  FormFactor,
} from "@ram-catalog/shared";

const API_PREFIX = "/api";

export const ramApi = {
  // --- GET ЗАПИТИ (ОТРИМАННЯ ДАНИХ) ---

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

  getManufacturers: async (): Promise<Manufacturer[]> => {
    const response = await fetch(`${API_PREFIX}/manufacturers`);
    if (!response.ok) {
      throw new Error("Не вдалося завантажити список виробників");
    }
    return response.json();
  },

  getMemoryTypes: async (): Promise<MemoryType[]> => {
    const response = await fetch(`${API_PREFIX}/memoryTypes`);
    if (!response.ok) {
      throw new Error("Не вдалося завантажити стандарти пам'яті");
    }
    return response.json();
  },

  getFormFactors: async (): Promise<FormFactor[]> => {
    const response = await fetch(`${API_PREFIX}/formFactors`);
    if (!response.ok) {
      throw new Error("Не вдалося завантажити формфактори");
    }
    return response.json();
  },

  // --- POST ЗАПИТИ (СТВОРЕННЯ ДАНИХ) ---

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
    const response = await fetch(`${API_PREFIX}/memoryTypes`, {
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
    const response = await fetch(`${API_PREFIX}/formFactors`, {
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

  // --- PUT ЗАПИТИ (ОНОВЛЕННЯ) ---

  updateModel: async (
    id: number,
    updatedModel: Partial<RamModel>,
    token: string,
  ) => {
    const response = await fetch(`${API_PREFIX}/ram/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedModel),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Помилка при оновленні моделі");
    return { success: true, message: "Модель успішно оновлено!", data };
  },

  updateManufacturer: async (
    id: number,
    updatedMan: Partial<Manufacturer>,
    token: string,
  ) => {
    const response = await fetch(`${API_PREFIX}/manufacturers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedMan),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Помилка при оновленні виробника");
    return { success: true, message: "Виробника успішно оновлено!", data };
  },

  updateMemoryType: async (
    id: number,
    updatedType: Partial<MemoryType>,
    token: string,
  ) => {
    const response = await fetch(`${API_PREFIX}/memoryTypes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedType),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Помилка при оновленні стандарту");
    return { success: true, message: "Стандарт успішно оновлено!", data };
  },

  updateFormFactor: async (
    id: number,
    updatedForm: Partial<FormFactor>,
    token: string,
  ) => {
    const response = await fetch(`${API_PREFIX}/formFactors/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedForm),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Помилка при оновленні формфактора");
    return { success: true, message: "Формфактор успішно оновлено!", data };
  },

  // --- DELETE ЗАПИТИ (ВИДАЛЕННЯ) ---

  deleteModel: async (id: number, token: string) => {
    const response = await fetch(`${API_PREFIX}/ram/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Помилка при видаленні моделі");
    }
    return { success: true, message: "Модель успішно видалено!" };
  },

  deleteManufacturer: async (id: number, token: string) => {
    const response = await fetch(`${API_PREFIX}/manufacturers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Помилка при видаленні виробника");
    }
    return { success: true, message: "Виробника успішно видалено!" };
  },

  deleteMemoryType: async (id: number, token: string) => {
    const response = await fetch(`${API_PREFIX}/memoryTypes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Помилка при видаленні стандарту");
    }
    return { success: true, message: "Стандарт успішно видалено!" };
  },

  deleteFormFactor: async (id: number, token: string) => {
    const response = await fetch(`${API_PREFIX}/formFactors/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Помилка при видаленні формфактора");
    }
    return { success: true, message: "Формфактор успішно видалено!" };
  },
};
