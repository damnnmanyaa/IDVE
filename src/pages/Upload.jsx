import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileCheck2, FileText, Image, ShieldCheck, Upload as UploadIcon, X } from "lucide-react";
import api from "../services/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const selectFile = (candidate) => {
    if (!candidate) return;
    setError("");
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setFile(null);
      setError("Choose a PDF, PNG, or JPEG document.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("The file must be 5 MB or smaller.");
      return;
    }
    setFile(candidate);
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      await api.post("/api/user/upload-document", body);
      navigate("/dashboard", { replace: true, state: { uploadComplete: true } });
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080b10] px-4 py-6 text-[#edf3f8] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" aria-label="Back to dashboard" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08]"><ArrowLeft size={16} /></Link>
            <div><h1 className="text-lg font-semibold tracking-tight">Submit a document</h1><p className="mt-0.5 text-xs text-slate-400">Your private applicant workspace</p></div>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><ShieldCheck size={17} /></span>IDVE</span>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e131a] shadow-2xl shadow-black/30">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <p className="text-[10px] font-bold tracking-[0.16em] text-cyan-200/80">IDENTITY REVIEW / DOCUMENT SUBMISSION</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Add your verification document</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">An administrator will review your submission and update its status in your dashboard.</p>
          </div>

          <div className="p-6 sm:p-8">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}
              className="rounded-xl border border-dashed border-slate-600/70 bg-slate-900/30 px-5 py-10 text-center transition hover:border-cyan-300/50 hover:bg-cyan-300/[0.03] sm:px-10"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><UploadIcon size={21} /></div>
              <h3 className="mt-4 text-sm font-semibold">Drop a file here to get started</h3>
              <p className="mt-1 text-xs text-slate-400">PDF, PNG, or JPEG · up to 5 MB</p>
              <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10">Browse files</button>
              <input ref={inputRef} type="file" accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100">{file.type === "application/pdf" ? <FileText size={18} /> : <Image size={18} />}</span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-xs font-semibold">{file.name}</strong><small className="mt-1 block text-[10px] text-slate-400">{formatSize(file.size)} · Ready to upload</small></span>
                <button type="button" aria-label="Remove selected file" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"><X size={15} /></button>
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-xs text-rose-200">{error}</p>}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-[10px] leading-5 text-slate-500"><FileCheck2 size={14} className="shrink-0" />Demo only: use synthetic documents, never real identity records.</p>
              <button type="button" onClick={handleUpload} disabled={!file || isUploading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-100 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                {isUploading ? "Uploading…" : "Submit for review"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
