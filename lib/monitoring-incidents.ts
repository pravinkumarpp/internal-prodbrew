import { appendFile, mkdir } from "fs/promises";
import path from "path";

type IncidentSeverity = "warning" | "error";

type MonitoringIncident = {
  sourceType: "server_log" | "ui_log" | "api_log" | "api_monitoring";
  severity: IncidentSeverity;
  clientId: string;
  message: string;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
};

const INCIDENTS_DIR = path.join(process.cwd(), "runtime", "monitoring");
const INCIDENTS_FILE = path.join(INCIDENTS_DIR, "incidents.jsonl");

export async function recordMonitoringIncident(
  incident: MonitoringIncident,
): Promise<void> {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...incident,
  });

  await mkdir(INCIDENTS_DIR, { recursive: true });
  await appendFile(INCIDENTS_FILE, `${line}\n`, "utf8");
}
