"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shield, CloudUpload, User, X, LayoutGrid, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DRAFT_KEY_PREFIX = "maintainai-task-draft-";

type Client = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type BasecampMember = {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
};

type Draft = {
  title: string;
  priority: string;
  taskType: string;
  description: string;
  basecampTarget: string;
  assigneeId: string;
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
  const [basecampTarget, setBasecampTarget] = useState("");
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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/basecamp/people")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setMembers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
        if (d.basecampTarget != null) setBasecampTarget(String(d.basecampTarget));
        if (d.assigneeId != null) setAssigneeId(String(d.assigneeId));
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
          basecampTarget,
          assigneeId,
        } satisfies Draft),
      );
      toast.success("Draft saved. You can return later to submit.");
    } catch {
      toast.error("Could not save draft");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !description.trim() || !basecampTarget) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("title", taskTitle.trim());
      formData.append("priority", priority || "medium");
      formData.append("task_type", taskType || "improvement");
      formData.append("description", description.trim());
      formData.append("basecamp_target", basecampTarget);
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
      setBasecampTarget("");
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
        .brand-accent-bg { background-color: #e5e8ff; }
        .brand-border-active { border-color: #000b36; }
        .brand-button {
          background-color: #000b36;
          transition: all 0.2s ease;
        }
        .brand-button:hover {
          background-color: #000326;
          transform: translateY(-1px);
        }
      `}</style>

      <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg  flex items-center justify-center">
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
              Prodbrew-projects
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

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Create in Basecamp as <span className="text-red-500">*</span>
                  </span>
                  {basecampTarget && (
                    <button
                      type="button"
                      onClick={() => setBasecampTarget("")}
                      className="text-xs font-medium text-white bg-[#000b36] hover:bg-[#000326] px-2 py-0.5 rounded-md border border-[#000b36] transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBasecampTarget("card")}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                      basecampTarget === "card"
                        ? "border-[#000b36] bg-[#e5e8ff] ring-1 ring-[#000b36]"
                        : "border-gray-200 bg-white hover:border-amber-400 hover:bg-gray-50",
                    )}
                  >
                    <LayoutGrid
                      className={cn(
                        "h-6 w-6",
                        basecampTarget === "card" ? "text-[#000b36]" : "text-gray-400",
                      )}
                    />
                    <span className="font-semibold text-gray-900">Card</span>
                    <span className="text-xs text-gray-500">
                      Add as a card on the project board
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasecampTarget("message_board")}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                      basecampTarget === "message_board"
                        ? "border-[#000b36] bg-[#e5e8ff] ring-1 ring-[#000b36]"
                        : "border-gray-200 bg-white hover:border-amber-400 hover:bg-gray-50",
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "h-6 w-6",
                        basecampTarget === "message_board" ? "text-[#000b36]" : "text-gray-400",
                      )}
                    />
                    <span className="font-semibold text-gray-900">Message Board</span>
                    <span className="text-xs text-gray-500">
                      Post as a message on the board
                    </span>
                  </button>
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
                  className="w-full rounded-lg border border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm py-2.5 px-3"
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

              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  Attachments (Screenshots, Logs, Specs)
                </span>
                <label
                  htmlFor="attachments"
                  className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors cursor-pointer group"
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
                  <CloudUpload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-amber-500 transition-colors" />
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
