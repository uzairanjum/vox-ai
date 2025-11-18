"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  File,
  X,
  Globe,
  CheckCircle,
  Edit3,
  Save,
  Trash2,
} from "lucide-react";
import { useSocket } from "../../../context/SocketProvider";
import { toast } from "sonner";

/* ---------- TYPES ---------- */
export interface Faq {
  id: number;
  question: string;
  answer: string;
}

interface ChooseYouContentSourceProps {
  onFilesSelected: (files: File[]) => void;
  onCrawlerLink: (link: string) => void;
  onFaqsSubmit: (faqs: Faq[]) => void; // batch callback when modal saves
  onFaqsChange?: (faqs: Faq[]) => void; // live stream (optional)
}

interface FilePreview {
  id: number;
  name: string;
  size: number;
  type: string;
  status: "ready";
}

interface CrawlerLink {
  id: number;
  url: string;
  status: "ready";
}

type FileState =
  | "ready"
  | "starting"
  | "chunking"
  | "embedding"
  | "completed"
  | "done"
  | "error";

/* ---------- COMPONENT ---------- */
export default function ChooseYouContentSource({
  onFilesSelected,
  onCrawlerLink,
  onFaqsSubmit,
  onFaqsChange,
}: ChooseYouContentSourceProps) {
  /* ----- state ----- */
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [crawlerLinks, setCrawlerLinks] = useState<CrawlerLink[]>([]);
  const [crawlerLink, setCrawlerLink] = useState("");
  // converted: showCrawlerModal (was inline input). Keeps behaviour but as modal.
  const [showCrawlerModal, setShowCrawlerModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [fileStatus, setFileStatus] = useState<Record<string, FileState>>({});
  const [fileChunks, setFileChunks] = useState<Record<string, number>>({});
  const [crawlerStatus, setCrawlerStatus] = useState<Record<string, string>>(
    {}
  );
  const [faqStatus, setFaqStatus] = useState<Record<string, string>>({});

  // MAIN list visible under files / links
  const [faqs, setFaqs] = useState<Faq[]>([]);

  // DRAFT list used inside modal only
  const [modalFaqs, setModalFaqs] = useState<Faq[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileStoreRef = useRef<Map<string, File>>(new Map());

  const { socket } = useSocket();

  /* ---- keep parent in sync ---- */
  useEffect(() => {
    onFaqsChange?.(faqs);
  }, [faqs, onFaqsChange]);

  /* ---------- FILE HANDLING (unchanged) ---------- */
  const validateFiles = (list: FileList): File[] => {
    const supported = [
      "application/pdf",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const valid: File[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (fileStoreRef.current.has(f.name)) {
        toast.error(`⚠️ File already added: ${f.name}`);
        continue;
      }
      if (!supported.includes(f.type)) {
        toast.error(`❌ Unsupported file type: ${f.name}`);
        continue;
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`❌ File too large (max 50MB): ${f.name}`);
        continue;
      }
      valid.push(f);
    }
    return valid;
  };

  const addFilePreviews = (valid: File[]) => {
    if (files.length + valid.length > 3) {
      toast.error("⚠️ You can upload a maximum of 3 files only.");
      return;
    }
    const previews = valid.map((f, idx) => {
      const id = Date.now() + idx;
      fileStoreRef.current.set(f.name, f);
      return {
        id,
        name: f.name,
        size: f.size,
        type: f.type,
        status: "ready" as const,
      };
    });
    const next = [...files, ...previews];
    setFiles(next);

    // ➜  NEW: mark every new file as "ready"
    const newStatus: Record<string, FileState> = {};
    const newChunks: Record<string, number> = {};
    valid.forEach((f) => {
      newStatus[f.name] = "ready";
      newChunks[f.name] = 0;
    });
    setFileStatus((prev) => ({ ...prev, ...newStatus }));
    setFileChunks((prev) => ({ ...prev, ...newChunks }));

    onFilesSelected(Array.from(fileStoreRef.current.values()));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFilePreviews(validateFiles(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    addFilePreviews(validateFiles(e.dataTransfer.files));
  };

  const handleRemoveFile = (id: number, name: string) => {
    fileStoreRef.current.delete(name);
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    onFilesSelected(Array.from(fileStoreRef.current.values()));
  };

  /* ---------- CRAWLER (moved to modal) ---------- */
  const handleCrawlerSubmit = () => {
    const url = crawlerLink.trim();
    if (!url) {
      toast.error("Please enter a website link.");
      return;
    }
    const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/i;
    if (!pattern.test(url)) {
      toast.error(
        "Please enter a valid website URL (e.g., https://example.com)."
      );
      return;
    }
    const newLink: CrawlerLink = {
      id: Date.now(),
      url: url.startsWith("http") ? url : `https://${url}`,
      status: "ready",
    };
    setCrawlerLinks((p) => [...p, newLink]);
    onCrawlerLink(newLink.url);
    setCrawlerLink(""); // ← clear box
    setShowCrawlerModal(false);
    toast.success("Website link added!");
  };

  const handleRemoveLink = (id: number) => {
    setCrawlerLinks((p) => p.filter((l) => l.id !== id));
  };

  /* ---------- FAQ – MODAL ONLY (DRAFT) ---------- */
  const openFaqModal = () => {
    setModalFaqs([{ id: Date.now(), question: "", answer: "" }]);
    setShowFaqModal(true);
  };

  const closeFaqModal = () => {
    setShowFaqModal(false);
    setModalFaqs([]);
  };

  const updateModalFaq = (
    id: number,
    field: "question" | "answer",
    value: string
  ) =>
    setModalFaqs((p) =>
      p.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );

  const addEmptyModalFaq = () =>
    setModalFaqs((p) => [...p, { id: Date.now(), question: "", answer: "" }]);

  const removeModalFaq = (id: number) =>
    setModalFaqs((p) => p.filter((f) => f.id !== id));

  const saveFaqModal = () => {
    const valid = modalFaqs.filter((f) => f.question.trim() && f.answer.trim());
    if (valid.length === 0) {
      toast.error("Please fill at least one question and answer.");
      return;
    }
    // ---- APPEND instead of REPLACE ----
    const withUniqueIds = valid.map((f) => ({
      ...f,
      id: Date.now() + Math.random(),
    }));
    const merged = [...faqs, ...withUniqueIds];
    setFaqs(merged);
    onFaqsSubmit(merged); // parent gets full merged array
    closeFaqModal();
    toast.success("FAQs added successfully!");
  };

  /* ---------- MAIN FAQ – INLINE EDIT ---------- */
  const updateFaq = (id: number, field: "question" | "answer", value: string) =>
    setFaqs((p) => p.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const removeFaq = (id: number) =>
    setFaqs((p) => p.filter((f) => f.id !== id));

  function StatusBadge({
    status,
    chunks,
  }: {
    status: FileState;
    chunks?: number;
  }) {
    const map: Record<FileState, string> = {
      ready: "Ready to upload",
      starting: "Starting…",
      chunking: "Chunking…",
      embedding: "Embedding…",
      completed: "✅ Completed",
      done: chunks ? `✅ Done (${chunks})` : "✅ Done",
      error: "❌ Failed",
    };
    const color: Record<FileState, string> = {
      ready: "text-yellow-400",
      starting: "text-blue-400",
      chunking: "text-purple-400",
      embedding: "text-indigo-400",
      completed: "text-green-400",
      done: "text-green-400",
      error: "text-red-400",
    };

    return (
      <span
        className={`bg-gray-700/50 text-xs font-medium px-2 py-1 rounded-full ${color[status]}`}
      >
        {map[status]}
      </span>
    );
  }

  useEffect(() => {
    if (!socket) return;

    const handleFileStatus = (msg: any) => {
      setFileStatus((prev) => ({ ...prev, [msg.fileName]: msg.status }));
    };

    const handleLinkStatus = (url: any) => {
      setCrawlerStatus((prev) => ({ ...prev, [url.url]: url.status }));
    };

    const handleFAQStatus = (faq: any) => {
      setFaqStatus((prev) => ({ ...prev, [faq.fileName]: faq.status }));
    };

    socket.on("file_status", handleFileStatus);
    socket.on("link_status", handleLinkStatus);
    socket.on("faq_status", handleFAQStatus);

    return () => {
      socket.off("file_status", handleFileStatus);
      socket.off("link_status", handleLinkStatus);
      socket.off("faq_status", handleFAQStatus);
    };
  }, [socket]);

  /* ---------- UI ---------- */
  return (
    <div className="w-full py-10 text-center">
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* source cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            id: 1,
            title: "Upload Files",
            desc: "Upload and train your agent using PDF, DOCX, or CSV files.",
            action: "Drag & Drop or Browse Files",
            icon: <FileText className="w-8 h-8 text-gray-300" />,
          },
          {
            id: 2,
            title: "Crawl Website",
            desc: "Point your agent to a website and let it extract content automatically.",
            action: "Enter URL to crawl",
            icon: <Globe className="w-8 h-8 text-gray-300" />,
          },
          {
            id: 3,
            title: "Add FAQs",
            desc: "Directly input frequently asked questions and answers for quick training.",
            action: "Start Adding FAQs",
            icon: <Globe className="w-8 h-8 text-gray-300" />,
          },
        ].map((s) => (
          <div
            key={s.id}
            onClick={() =>
              s.id === 1
                ? fileInputRef.current?.click()
                : s.id === 2
                ? setShowCrawlerModal(true)
                : openFaqModal()
            }
            onDragOver={(e) => s.id === 1 && e.preventDefault()}
            onDrop={(e) => s.id === 1 && handleDrop(e)}
            className="bg-[#171717] border border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-all duration-300 hover:border-[#ef3e6d] hover:bg-[#150d0e] cursor-pointer"
          >
            <div className="w-14 h-14 rounded-lg bg-[#262626] flex items-center justify-center mb-4">
              {s.icon}
            </div>
            <h3 className="text-white text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-gray-400 text-sm text-center">{s.desc}</p>
            <div className="mt-4">
              <span className="px-3 py-1 bg-[#262626] text-gray-200 text-xs rounded-full">
                {s.action}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* crawler modal */}
      {showCrawlerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setShowCrawlerModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white text-xl font-semibold mb-4">
              Add Website to Crawl
            </h3>

            <div className="flex flex-col gap-3">
              <input
                type="url"
                placeholder="Enter website link (e.g. https://example.com )"
                value={crawlerLink}
                onChange={(e) => setCrawlerLink(e.target.value)}
                className="flex-1 bg-[#2a2a2a] text-white text-sm rounded-lg px-4 py-2 focus:outline-none border border-gray-600 focus:border-[#ef3e6d] transition"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCrawlerSubmit}
                  className="bg-[#ef3e6d] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#d6345f] transition"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowCrawlerModal(false)}
                  className="bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- LISTS ---------- */}
      <div className="mt-6 space-y-3">
        {/* files */}
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between bg-[#262626] rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <File className="w-6 h-6 text-gray-300" />
              <div>
                <p className="text-white text-sm font-medium">{f.name}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {(f.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <StatusBadge
                status={fileStatus[f.name]}
                chunks={fileChunks[f.name]}
              />
              <button
                onClick={() => handleRemoveFile(f.id, f.name)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {/* crawler links (main list) */}
        {crawlerLinks.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between bg-[#262626] rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-gray-300" />
              <p className="text-white text-sm font-medium">{l.url}</p>
            </div>
            <div className="flex items-center space-x-3">
              <StatusBadge
                status={(crawlerStatus[l.url] as FileState) || "ready"}
              />

              <button
                onClick={() => handleRemoveLink(l.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {/* faqs review / edit (only after Save) */}
        {faqs.length > 0 && (
          <>
            <div className="pt-4" />
            {/* Live status badge */}
            {Object.entries(faqStatus).map(([name, status]) => (
              <div
                key={name}
                className="flex items-center justify-between bg-[#262626] rounded-lg p-4 border border-gray-700 mb-3"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-gray-300" />
                  <p className="text-white text-sm font-medium">FAQs</p>
                </div>
                <StatusBadge status={status as FileState} />
              </div>
            ))}

            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-[#262626] rounded-lg p-4 border border-gray-700"
              >
                {editingId === faq.id ? (
                  <div className="space-y-3">
                    <input
                      value={faq.question}
                      onChange={(e) =>
                        updateFaq(faq.id, "question", e.target.value)
                      }
                      className="w-full bg-[#2a2a2a] text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                      placeholder="Question"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) =>
                        updateFaq(faq.id, "answer", e.target.value)
                      }
                      rows={3}
                      className="w-full bg-[#2a2a2a] text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                      placeholder="Answer"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => removeFaq(faq.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-white font-medium">
                      {faq.question || (
                        <span className="text-gray-400">No question</span>
                      )}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      {faq.answer || (
                        <span className="text-gray-500">No answer</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setEditingId(faq.id)}
                        className="text-xs text-[#ef3e6d] hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => removeFaq(faq.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={openFaqModal}
                className="text-sm text-[#ef3e6d] font-medium hover:underline"
              >
                + Add another FAQ
              </button>
            </div>
          </>
        )}
      </div>

      {/* ---------- FAQ MODAL (draft only) ---------- */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-xl relative">
            <button
              onClick={closeFaqModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white text-xl font-semibold mb-4">Add FAQs</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {modalFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-[#262626] p-4 rounded-lg border border-gray-600"
                >
                  <input
                    value={faq.question}
                    onChange={(e) =>
                      updateModalFaq(faq.id, "question", e.target.value)
                    }
                    placeholder="Enter question"
                    className="w-full bg-[#2a2a2a] text-white rounded-lg px-3 py-2 mb-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) =>
                      updateModalFaq(faq.id, "answer", e.target.value)
                    }
                    placeholder="Enter answer"
                    rows={3}
                    className="w-full bg-[#2a2a2a] text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                  />
                  {modalFaqs.length > 1 && (
                    <button
                      onClick={() => removeModalFaq(faq.id)}
                      className="text-xs text-red-400 mt-2 hover:text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-5">
              <button
                onClick={addEmptyModalFaq}
                className="text-sm text-[#ef3e6d] font-medium hover:underline"
              >
                + Add Another
              </button>
              <button
                onClick={saveFaqModal}
                className="bg-[#ef3e6d] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#d6345f] transition"
              >
                Save FAQs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
