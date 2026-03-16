"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Zap, Shield, CloudUpload, User } from "lucide-react";
import { toast } from "sonner";

const DRAFT_KEY_PREFIX = "maintainai-task-draft-";

type Client = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type Draft = {
  title: string;
  priority: string;
  taskType: string;
  description: string;
};

export default function ClientFormPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [taskType, setTaskType] = useState("");
  const [description, setDescription] = useState("");
  const [fileCount, setFileCount] = useState(0);
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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!client || !slug || typeof window === "undefined") return;
    const key = `${DRAFT_KEY_PREFIX}${slug}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft | null;
      if (d && typeof d === "object") {
        if (d.title != null) setTaskTitle(String(d.title));
        if (d.priority != null) setPriority(String(d.priority));
        if (d.taskType != null) setTaskType(String(d.taskType));
        if (d.description != null) setDescription(String(d.description));
        toast.info("Draft restored");
      }
    } catch {
      // ignore invalid draft
    }
  }, [client, slug]);

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
            Client not found
          </h2>
          <p className="text-gray-500 mb-4">
            This form link may be incorrect or the client may have been removed.
          </p>
          <Link href="/" className="text-amber-600 hover:underline font-medium">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  function handleSaveDraft() {
    const key = `${DRAFT_KEY_PREFIX}${slug}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          title: taskTitle,
          priority,
          taskType,
          description,
        } satisfies Draft),
      );
      toast.success("Draft saved. You can return later to submit.");
    } catch {
      toast.error("Could not save draft");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !priority || !taskType || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("title", taskTitle.trim());
      formData.append("priority", priority);
      formData.append("task_type", taskType);
      formData.append("description", description.trim());

      if (fileInputRef.current?.files?.length) {
        Array.from(fileInputRef.current.files).forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const res = await fetch("/api/public/tasks", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (data as { error?: string }).error || "Failed to submit task.",
        );
        setSubmitting(false);
        return;
      }

      try {
        localStorage.removeItem(`${DRAFT_KEY_PREFIX}${slug}`);
      } catch {
        // ignore
      }
      toast.success(
        "Task submitted successfully! Our engineers will review it shortly.",
      );
      setTaskTitle("");
      setPriority("");
      setTaskType("");
      setDescription("");
      setFileCount(0);
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
        .brand-accent-bg { background-color: #fdf8f3; }
        .brand-border-active { border-color: #634832; }
        .brand-button {
          background-color: #3b2f2f;
          transition: all 0.2s ease;
        }
        .brand-button:hover {
          background-color: #1a1414;
          transform: translateY(-1px);
        }
      `}</style>

      <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
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
            <h1 className="text-2xl font-bold text-gray-900">Task Intake</h1>
            <p className="text-sm text-gray-500 mt-1">
              Submit a new request to the PrdBrew engineering team.
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
              <h2 className="text-lg font-semibold text-slate-800">
                Task Specification
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Please provide as much detail as possible to help our
                &apos;brewers&apos; process your request faster.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              <div>
                <label
                  htmlFor="task-title"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="task-title"
                  name="task-title"
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Integrate Stripe Checkout for Premium Tiers"
                  className="w-full rounded-lg border border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm py-2.5 px-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="task-priority"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="task-priority"
                    name="task-priority"
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm py-2.5 px-3"
                  >
                    <option value="">Select priority level</option>
                    <option value="low">
                      Low - General inquiry / Long term
                    </option>
                    <option value="medium">
                      Medium - Standard improvement
                    </option>
                    <option value="high">High - Impacting workflow</option>
                    <option value="urgent">Urgent - Critical blocker</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="task-type"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Task Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="task-type"
                    name="task-type"
                    required
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm py-2.5 px-3"
                  >
                    <option value="">Select type</option>
                    <option value="bug">Bug - Something is broken</option>
                    <option value="feature">
                      Feature Request - New functionality
                    </option>
                    <option value="improvement">
                      Improvement - Enhance existing feature
                    </option>
                    <option value="support">
                      Support - General assistance
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="task-description"
                  name="task-description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe the problem or requirement. For bugs, include steps to reproduce. For features, describe the desired outcome."
                  className="w-full rounded-lg border border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm py-2.5 px-3"
                />
                <p className="mt-2 text-xs text-gray-400 italic">
                  Markdown is supported for formatting.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Attachments (Screenshots, Logs, Specs)
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileInputRef.current?.click()
                  }
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="attachments"
                    name="attachments"
                    multiple
                    className="hidden"
                    onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
                  />
                  <label htmlFor="attachments" className="cursor-pointer">
                    <CloudUpload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-amber-500 transition-colors" />
                    <p
                      className={`mt-2 text-sm font-medium ${fileCount > 0 ? "text-amber-600" : "text-gray-600"}`}
                    >
                      {fileCount > 0
                        ? `${fileCount} file(s) selected`
                        : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, PDF, ZIP up to 25MB each
                    </p>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="brand-button w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {submitting ? "Submitting..." : "Submit Task to MaintainAI"}
                </button>
              </div>
            </form>
          </div>

          <footer className="mt-8 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Shield className="h-4 w-4 shrink-0" />
              Securely encrypted submission. Expected response time: &lt; 4
              hours.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
