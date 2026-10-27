export interface RamExtraFeatures {
  has_rgb?: boolean;
  profiles?: string[]; 
  heatsink?: string; 
  tested_voltage?: number; 
  ecc?: boolean;
  ranks?: string; 
  [key: string]: any;
}

export interface FormFactor {
  form_factor_id: number;
  form_factor_name: string;
  description?: string | null;
  image_url?: string | null;
}

export interface Manufacturer {
  manufacturer_id: number;
  name: string;
  country?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
}

export interface MemoryType {
  type_id: number;
  type_name: string;
  default_voltage: number;
  description?: string | null;
  image_url?: string | null;
}

export interface RamModel {
  ram_id: number;
  manufacturer_id: number;
  type_id: number;
  form_factor_id: number;
  model_name: string;
  capacity_gb: number;
  frequency_mhz: number;
  cas_latency?: number | null;
  extra_features: RamExtraFeatures;
  description?: string | null;
  image_url?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;

  manufacturer_name?: string;
  type_name?: string;
  form_factor_name?: string;
}

export interface User {
  user_id: number;
  login: string;
  password_hash?: string;
}
