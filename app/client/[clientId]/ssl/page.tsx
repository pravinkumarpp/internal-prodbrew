"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { toast } from "sonner";

type ClientSsl = {
  id: string;
  name: string;
  url: string;
  status: string | null;
  ssl_expiry_date: string | null;
  ssl_last_checked_at: string | null;
  ssl_issuer: string | null;
  ssl_protocol: string | null;
  ssl_auto_renewal: boolean | null;
};

export default function SSLPage() {
  const params = useParams();
  const clientId = params?.clientId as string | undefined;
  const [client, setClient] = useState<ClientSsl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setError("Missing client id");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setError((data as { error?: string }).error || "Failed to load SSL data.");
          }
          return;
        }
        if (!cancelled) {
          setClient(data as ClientSsl);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load SSL data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const derived = useMemo(() => {
    if (!client) {
      return {
        expiryLabel: "—",
        daysRemainingLabel: "—",
        statusLabel: "Unknown",
        statusColor: "text-text-muted",
        pillBg: "bg-text-muted/10",
        lastCheckedLabel: "—",
        providerLabel: "—",
        protocolLabel: "—",
      };
    }

    const status = (client.status || "Healthy") as "Healthy" | "Warning" | "Critical" | string;
    const expiryDate = client.ssl_expiry_date ? new Date(client.ssl_expiry_date) : null;
    const lastChecked = client.ssl_last_checked_at
      ? new Date(client.ssl_last_checked_at)
      : null;

    let daysRemaining: number | null = null;
    if (expiryDate && !Number.isNaN(expiryDate.getTime())) {
      const diffMs = expiryDate.getTime() - Date.now();
      daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    let statusLabel = "Secure";
    let statusColor = "text-emerald-500";
    let pillBg = "bg-emerald-500/10";

    if (status === "Critical" || (daysRemaining !== null && daysRemaining < 0)) {
      statusLabel = "Expired";
      statusColor = "text-red-500";
      pillBg = "bg-red-500/10";
    } else if (status === "Warning" || (daysRemaining !== null && daysRemaining <= 30)) {
      statusLabel = "Expiring Soon";
      statusColor = "text-amber-500";
      pillBg = "bg-amber-500/10";
    }

    const expiryLabel =
      expiryDate && !Number.isNaN(expiryDate.getTime())
        ? expiryDate.toLocaleDateString()
        : "—";
    const daysRemainingLabel =
      daysRemaining !== null ? `${daysRemaining} day${Math.abs(daysRemaining) === 1 ? "" : "s"}` : "—";
    const lastCheckedLabel =
      lastChecked && !Number.isNaN(lastChecked.getTime())
        ? lastChecked.toLocaleString()
        : "—";

    const providerLabel = client.ssl_issuer || "Unknown";
    const protocolLabel = client.ssl_protocol || "Unknown";

    return {
      expiryLabel,
      daysRemainingLabel,
      statusLabel,
      statusColor,
      pillBg,
      lastCheckedLabel,
      providerLabel,
      protocolLabel,
    };
  }, [client]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <AppLayout title="SSL Monitoring">
      <div className="max-w-3xl">
        {loading ? (
          <p className="text-text-muted">Loading SSL data…</p>
        ) : error ? (
          <div className="card flex items-center gap-3">
            <AlertTriangle className="text-red-500" />
            <p className="text-text-muted text-sm">{error}</p>
          </div>
        ) : (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    derived.statusLabel === "Expired"
                      ? "bg-red-500/10 text-red-500"
                      : derived.statusLabel === "Expiring Soon"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {derived.statusLabel === "Expired"
                      ? "Certificate Expired"
                      : derived.statusLabel === "Expiring Soon"
                        ? "Certificate Expiring Soon"
                        : "Certificate is Valid"}
                  </h3>
                  <p className="text-text-muted text-sm">
                    Last checked: {derived.lastCheckedLabel}
                  </p>
                </div>
              </div>
              <span
                className={`px-4 py-1 rounded-full text-sm font-bold ${derived.pillBg} ${derived.statusColor}`}
              >
                {derived.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 py-6 border-t border-card-border">
              <div>
                <p className="text-small mb-1">Expiry Date</p>
                <p className="text-lg font-semibold">{derived.expiryLabel}</p>
              </div>
              <div>
                <p className="text-small mb-1">Days Remaining</p>
                <p
                  className={`text-lg font-semibold ${
                    derived.statusLabel === "Expired"
                      ? "text-red-500"
                      : derived.statusLabel === "Expiring Soon"
                        ? "text-amber-500"
                        : "text-emerald-500"
                  }`}
                >
                  {derived.daysRemainingLabel}
                </p>
              </div>
              <div>
                <p className="text-small mb-1">Provider</p>
                <p className="text-lg font-semibold truncate">
                  {derived.providerLabel}
                </p>
              </div>
              <div>
                <p className="text-small mb-1">Protocol</p>
                <p className="text-lg font-semibold truncate">
                  {derived.protocolLabel}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
