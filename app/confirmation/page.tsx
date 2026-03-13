"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!hash || hash.charAt(0) !== "#") return params;
  const query = hash.slice(1);
  for (const part of query.split("&")) {
    const [key, value] = part.split("=");
    if (key && value) params[key] = decodeURIComponent(value);
  }
  return params;
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hashSessionSet, setHashSessionSet] = useState<boolean | null>(null);

  useEffect(() => {
    if (code) {
      window.location.href = `/api/auth/exchange-code?code=${encodeURIComponent(code)}&next=/`;
      return;
    }
  }, [code]);

  useEffect(() => {
    if (hashSessionSet !== null) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const params = parseHashParams(hash);
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    const hashType = params.type;
    if (accessToken && refreshToken && hashType === "invite") {
      const supabase = createClient();
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => {
          setHashSessionSet(true);
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        })
        .catch(() => setHashSessionSet(false));
    } else {
      setHashSessionSet(false);
    }
  }, [hashSessionSet]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (tokenHash && type === "invite") {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "invite",
      });
      if (verifyError) {
        setLoading(false);
        toast.error(verifyError.message);
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      toast.error(updateError.message);
      return;
    }

    const syncRes = await fetch("/api/auth/sync-user", {
      method: "POST",
      credentials: "include",
    });
    setLoading(false);
    if (!syncRes.ok) {
      toast.error("Account created but sync failed. You can still sign in.");
    }

    toast.success("Password set. Redirecting…");
    router.push("/");
    router.refresh();
  }

  const showPasswordForm =
    (tokenHash && type === "invite") || hashSessionSet === true;

  if (showPasswordForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Set your password</h2>
            <p className="text-text-muted">
              Create a password to finish accepting the invite.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-accent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-background border border-card-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary disabled:opacity-50 disabled:pointer-events-none"
              disabled={loading}
            >
              {loading ? "Setting password…" : "Confirm & continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (code) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-text-muted">Completing sign-in…</p>
      </div>
    );
  }

  if (hashSessionSet === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <p className="text-text-muted mb-4">Invalid or expired confirmation link.</p>
        <p className="text-sm text-text-muted mb-4">
          The invite email must use our confirmation link so you can set your password here. Ask your admin to update the invite email template in Supabase.
        </p>
        <a href="/login" className="text-accent hover:underline">
          Go to login
        </a>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <p className="text-text-muted">Loading…</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
