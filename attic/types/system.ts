export interface SystemConfig {
  id: string;
  key: string;
  value: string | number | boolean;
  category: string;
  updatedAt: Date;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "down";
  services: Record<string, { status: string; latency: number }>;
  lastChecked: Date;
}
