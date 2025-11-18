"use client";

import React, { useState, useRef } from "react";
import { CloudUpload, File, CheckCircle2, Loader2, X } from "lucide-react";

interface UploadFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "completed" | "failed";
  knowledgeBaseId?: string; // Add this field to store the actual ID from API
}

interface UploadComponentProps {
  onFilesUploaded?: (fileIds: string[]) => void; // Callback to pass file IDs to parent
}

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
];

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 50;

const UploadComponent: React.FC<UploadComponentProps> = ({
  onFilesUploaded,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (selectedFiles: FileList): File[] => {
    const validFiles: File[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        setError(`❌ ${file.name} is not a supported file type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`❌ ${file.name} exceeds the 50MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }
    return validFiles;
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]; // remove data:mime;base64,
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadFile = async (file: File, tempId: string) => {
    try {
      console.log("📂 Starting upload for:", file.name, {
        id: tempId,
        type: file.type,
        size: file.size,
      });

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: "uploading" } : f))
      );

      console.log("🔄 Reading file as base64...");
      const base64Content = await readFileAsBase64(file);
      console.log(
        "✅ Finished reading file. Base64 length:",
        base64Content.length
      );

      console.log(
        "🚀 Sending upload request to /api/ai/knowledgebase/upload..."
      );
      const res = await fetch("/api/ai/knowledgebase/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: base64Content,
          mimeType: file.type,
          size: file.size,
          metadata: { source: "user_upload" },
        }),
      });

      console.log("📡 Upload response status:", res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Upload failed. Server response:", errText);
        throw new Error(errText);
      }

      // Mark as processing
      setFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: "processing" } : f))
      );
      console.log("⚙️ File marked as processing...");

      const data = await res.json();
      console.log("✅ Upload response JSON:", data);

      const knowledgeBaseId = data.data?.id; // This is the ID you need for training
      console.log("📘 Extracted knowledgeBaseId:", knowledgeBaseId);

      // Mark as completed
      setFiles((prev) =>
        prev.map((f) =>
          f.id === tempId
            ? {
                ...f,
                status: "completed",
                knowledgeBaseId: knowledgeBaseId,
              }
            : f
        )
      );
      console.log("🎉 File marked as completed");

      // Notify parent component about the uploaded file
      if (knowledgeBaseId && onFilesUploaded) {
        console.log(
          "📤 Notifying parent about uploaded file ID:",
          knowledgeBaseId
        );
        onFilesUploaded([knowledgeBaseId]);
      }

      return knowledgeBaseId;
    } catch (err: any) {
      console.error("🔥 Upload failed:", err.message || err);
      setFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: "failed" } : f))
      );
      setError(err.message || "Upload failed");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const validFiles = validateFiles(selectedFiles).slice(
      0,
      MAX_FILES - files.length
    );
    if (validFiles.length === 0) return;

    const newFiles: UploadFile[] = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      status: "uploading",
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Trigger real upload
    validFiles.forEach((file, i) => uploadFile(file, newFiles[i].id));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (files.length >= MAX_FILES) {
      setError(`❌ You can only upload up to ${MAX_FILES} files.`);
      return;
    }
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0 && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      validateFiles(droppedFiles)
        .slice(0, MAX_FILES - files.length)
        .forEach((file) => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current } as any);
    }
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const completedFiles = files.filter(
    (file) => file.status === "completed" && file.knowledgeBaseId
  );

  return (
    <div className="w-full mx-auto p-4 md:p-6 bg-[#171717] rounded-2xl border border-gray-700 shadow-md">
      {/* Header */}
      <div className="flex space-x-4 mb-5">
        <div className="flex w-10 h-10 rounded-full bg-[#262626] justify-center items-center">
          <File />
        </div>
        <div>
          <h3 className="text-white text-lg font-semibold leading-tight">
            Upload Documents
          </h3>
          <span className="text-gray-400 text-xs md:text-sm">
            Drag and drop files or click to browse
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div
        className={`border-2 border-dashed rounded-lg py-20 text-center cursor-pointer transition-colors ${
          files.length >= MAX_FILES
            ? "border-gray-700 opacity-50 cursor-not-allowed"
            : "border-gray-600 hover:border-[#ef3e6d]"
        }`}
        onClick={() =>
          files.length < MAX_FILES && fileInputRef.current?.click()
        }
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <CloudUpload className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="mt-3 text-gray-200 font-medium">
          Drop files here to upload
        </p>
        <p className="text-gray-400 text-sm">
          or click to browse from your computer
        </p>
        <button
          className={`mt-4 px-5 py-2 rounded-md ${
            files.length >= MAX_FILES
              ? "bg-gray-600 cursor-not-allowed text-gray-300"
              : "bg-[#262626] hover:bg-[#ef3e6d] text-white"
          }`}
          type="button"
          disabled={files.length >= MAX_FILES}
        >
          Browse Files
        </button>
        <p className="mt-2 text-xs text-gray-500">
          Supported: PDF, DOC, DOCX, TXT, RTF (Max {MAX_FILE_SIZE_MB}MB per
          file, Max {MAX_FILES} files)
        </p>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.rtf"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-3 text-red-400 text-sm text-center font-medium">
          {error}
        </p>
      )}

      {/* File List */}
      <div className="mt-6 space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between bg-[#262626] rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <File className="w-6 h-6 text-gray-300" />
              <div>
                <p className="text-white text-sm font-medium">{file.name}</p>
                <div className="flex mt-1">
                  <p className="text-gray-400 text-xs mr-1">{file.size} • </p>
                  {file.status === "uploading" && (
                    <div className="flex items-center text-gray-400 text-xs">
                      Uploading...
                    </div>
                  )}
                  {file.status === "processing" && (
                    <div className="flex items-center text-gray-400 text-xs">
                      Processing...
                    </div>
                  )}
                  {file.status === "completed" && (
                    <div className="flex items-center text-green-400 text-xs">
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {file.status === "uploading" && (
                <div className="flex items-center text-gray-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Uploading...
                </div>
              )}
              {file.status === "processing" && (
                <div className="flex items-center text-gray-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                  Processing...
                </div>
              )}
              {file.status === "completed" && (
                <div className="flex items-center text-green-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Ready
                </div>
              )}
              {/* Delete Button */}
              <button
                onClick={() => handleRemove(file.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Debug info - remove in production */}
      {completedFiles.length > 0 && (
        <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            ✅ {completedFiles.length} file(s) ready for training. File IDs:{" "}
            {completedFiles.map((f) => f.knowledgeBaseId).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadComponent;
