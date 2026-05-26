"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shield, CloudUpload, User, X } from "lucide-react";
import { toast } from "sonner";

type Client = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  basecamp_project_id: number | null;
  bug_form_generated: boolean | null;
};

type BasecampMember = {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
};

export default function BugFormPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [members, setMembers] = useState<BasecampMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/public/client/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setClient(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!client?.basecamp_project_id) {
      setMembersLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/basecamp/people?project_id=${client.basecamp_project_id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setMembers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => { cancelled = true; };
  }, [client]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Project not found
          </h2>
          <p className="text-gray-500 mb-4">
            This form link may be incorrect or the project may have been removed.
          </p>
          <Link href="/" className="text-amber-600 hover:underline font-medium">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  if (!client.bug_form_generated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Bug form not available
          </h2>
          <p className="text-gray-500 mb-4">
            The bug report form has not been enabled for this project yet.
          </p>
          <Link href="/" className="text-amber-600 hover:underline font-medium">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !priority || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("title", taskTitle.trim());
      formData.append("priority", priority);
      formData.append("task_type", "bug");
      formData.append("description", description.trim());
      formData.append("basecamp_target", "card");
      formData.append("source_form", "bug_form");
      if (assigneeId) {
        formData.append("assignee_id", assigneeId);
        const selectedMember = members.find((m) => String(m.id) === assigneeId);
        if (selectedMember) {
          formData.append("assignee_name", selectedMember.name);
        }
      }

      selectedFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await fetch("/api/public/tasks", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (data as { error?: string }).error || "Failed to submit bug report.",
        );
        setSubmitting(false);
        return;
      }

      toast.success("Bug report submitted successfully!");
      setTaskTitle("");
      setPriority("");
      setDescription("");
      setAssigneeId("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col">
      <style>{`
        .brand-accent-bg { background-color: #fef2f2; }
        .brand-border-active { border-color: #dc2626; }
        .brand-button {
          background-color: #dc2626;
          transition: all 0.2s ease;
        }
        .brand-button:hover {
          background-color: #b91c1c;
          transform: translateY(-1px);
        }
      `}</style>

      <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Image
                src="/favicon.png"
                alt="MaintainAI"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              MaintainAI
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500">
              <User className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-none">
              {client.name}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Bug Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Report a bug to the engineering team for quick resolution.
            </p>
            <div className="flex justify-center mt-6">
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-14 w-auto object-contain"
                />
              ) : (
                <div className="h-14 w-14 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold">
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="brand-accent-bg border-b border-gray-100 px-6 sm:px-8 py-6">
              <h2 className="text-lg font-semibold text-red-800">
                Bug Details
              </h2>
              <p className="text-sm text-red-600/80 mt-1">
                Please provide steps to reproduce and any relevant screenshots.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              <div>
                <label
                  htmlFor="bug-title"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Bug Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="bug-title"
                  name="bug-title"
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Login button not responding on mobile"
                  className="w-full rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm py-2.5 px-3"
                />
              </div>

              <div>
                <label
                  htmlFor="bug-priority"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  id="bug-priority"
                  name="bug-priority"
                  required
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm py-2.5 px-3"
                >
                  <option value="">Select severity level</option>
                  <option value="low">Low - Minor visual issue</option>
                  <option value="medium">Medium - Feature partially broken</option>
                  <option value="high">High - Major feature broken</option>
                  <option value="urgent">Critical - System down / Data loss</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="bug-description"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Steps to Reproduce <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bug-description"
                  name="bug-description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder={"1. Go to...\n2. Click on...\n3. Observe that...\n\nExpected: ...\nActual: ..."}
                  className="w-full rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm py-2.5 px-3"
                />
              </div>

              {/* Assign To field - hidden for now
              <div>
                <label
                  htmlFor="assignee"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Assign To
                </label>
                <select
                  id="assignee"
                  name="assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={membersLoading}
                  className="w-full rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm py-2.5 px-3"
                >
                  <option value="">
                    {membersLoading ? "Loading members..." : "Unassigned"}
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              */}

              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  Screenshots / Evidence
                </span>
                <label
                  htmlFor="attachments"
                  className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="attachments"
                    name="attachments"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const newFiles = e.target.files ? Array.from(e.target.files) : [];
                      setSelectedFiles((prev) => [...prev, ...newFiles]);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  <CloudUpload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-red-500 transition-colors" />
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, PDF, ZIP up to 25MB each
                  </p>
                </label>

                {selectedFiles.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-gray-700 truncate mr-2">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="shrink-0 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="brand-button w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {submitting ? "Submitting..." : "Submit Bug Report"}
                </button>
              </div>
            </form>
          </div>

          <footer className="mt-8 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Shield className="h-4 w-4 shrink-0" />
              Securely encrypted submission. Expected response time: &lt; 4 hours.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
