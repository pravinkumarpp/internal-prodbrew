"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Edit3, LogOut, X, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout";

type TeamUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
};

export default function TeamManagementPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "Founder" | "Project Manager" | "Developer"
  >("Developer");
  const [inviteLoading, setInviteLoading] = useState(false);

  const loadTeam = async () => {
    try {
      const res = await fetch("/api/team", { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error((body as { error?: string }).error || "Failed to load team");
        setTeam([]);
      } else {
        const data = (await res.json()) as TeamUser[];
        setTeam(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load team");
      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  return (
    <AppLayout title="Team Management">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Our Team</h2>
          <p className="text-text-muted">
            Manage roles and permissions for your organization
          </p>
        </div>
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={() => setInviteOpen(true)}
        >
          <PlusCircle size={20} />
          Invite Member
        </button>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading team…</p>
      ) : team.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary-bg flex items-center justify-center text-text-muted mb-6">
            <Users size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No team members yet
          </h3>
          <p className="text-text-muted max-w-sm mb-8">
            Invite your first teammate to start collaborating. They’ll get an
            email to set their password and join your workspace.
          </p>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="btn-primary"
          >
            <PlusCircle size={20} />
            Invite your first member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member) => {
            const name = member.full_name || member.email;
            const initials = name
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={member.id}
                className="card flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-secondary-bg flex items-center justify-center text-accent font-bold text-2xl mb-4 border-4 border-white shadow-md">
                  {initials}
                </div>
                <h3 className="text-lg font-bold text-text-primary">{name}</h3>
                <p className="text-sm text-text-muted mb-4">{member.email}</p>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    member.role === "Founder"
                      ? "bg-purple-100 text-purple-600"
                      : member.role === "Project Manager"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-emerald-100 text-emerald-600",
                  )}
                >
                  {member.role || "Developer"}
                </span>
                <div className="mt-6 pt-6 border-t border-card-border w-full flex justify-around">
                  <button
                    type="button"
                    className="text-text-muted hover:text-accent transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    type="button"
                    className="text-text-muted hover:text-red-500 transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card max-w-md w-full relative">
            <button
              type="button"
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              onClick={() => setInviteOpen(false)}
              aria-label="Close invite modal"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold mb-2">Invite Team Member</h3>
            <p className="text-sm text-text-muted mb-6">
              Send an invitation email to add a new collaborator to your
              workspace.
            </p>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setInviteLoading(true);
                try {
                  const res = await fetch("/api/invitations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: inviteEmail,
                      fullName: inviteName,
                      role: inviteRole,
                    }),
                  });
                  const body = await res.json();
                  if (!res.ok) {
                    throw new Error(body.error || "Failed to send invite");
                  }
                  toast.success("Invitation sent successfully");
                  setInviteOpen(false);
                  setInviteName("");
                  setInviteEmail("");
                  setInviteRole("Developer");
                  loadTeam();
                } catch (err: any) {
                  toast.error(err.message || "Failed to send invite");
                } finally {
                  setInviteLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="Alex Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="alex@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as
                        | "Founder"
                        | "Project Manager"
                        | "Developer",
                    )
                  }
                >
                  <option>Founder</option>
                  <option>Project Manager</option>
                  <option>Developer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary disabled:opacity-50 disabled:pointer-events-none"
                  disabled={inviteLoading}
                >
                  {inviteLoading ? "Sending…" : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
