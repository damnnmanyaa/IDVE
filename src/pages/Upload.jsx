import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Upload as UploadIcon, FileText, Image, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Upload() {
  const [files, setFiles] = useState([]);

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    fileArray.forEach((f) => simulateProgress(f));

    setFiles((prev) => [...prev, ...fileArray]);
  };

  const simulateProgress = (fileObj) => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += 10;

      setFiles((prev) =>
        prev.map((f) =>
          f.file.name === fileObj.file.name
            ? { ...f, progress }
            : f
        )
      );

      if (progress >= 100) clearInterval(interval);
    }, 150);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const renderFileIcon = (name) => {
    if (name.match(/\.(jpg|jpeg|png)$/i)) {
      return <Image className="h-4 w-4 text-[#A1A1AA] shrink-0" />;
    }
    return <FileText className="h-4 w-4 text-[#A1A1AA] shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F5] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 rounded-lg bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#F4F4F5] transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#F4F4F5]">Documents Workspace</h1>
              <p className="text-xs text-[#A1A1AA]">Upload and preview identity artifacts for verification.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#F4F4F5] text-[#09090B] flex items-center justify-center font-bold">
              <Shield className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[#F4F4F5]">IDVE</span>
          </div>
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Drag & Drop Card */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="rounded-xl border border-dashed border-[#27272A] bg-[#111113] hover:bg-[#151515] p-8 text-center transition flex flex-col items-center justify-center min-h-[320px] space-y-4"
          >
            <div className="h-12 w-12 rounded-full bg-[#18181B] border border-[#27272A] text-[#F4F4F5] flex items-center justify-center">
              <UploadIcon className="h-6 w-6 text-[#A1A1AA]" />
            </div>

            <div>
              <p className="text-base font-semibold text-[#F4F4F5]">
                Drag and drop files to upload
              </p>
              <p className="text-xs text-[#71717A] mt-1">or click browse below</p>
            </div>

            <label className="bg-[#F4F4F5] text-[#09090B] font-semibold py-2 px-5 rounded-lg text-xs hover:bg-white active:bg-zinc-200 transition cursor-pointer shadow-md inline-block">
              Browse Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            <p className="text-xs text-[#71717A]">
              Supported files: JPG, PNG, PDF
            </p>
          </div>

          {/* File List Card */}
          <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h2 className="text-sm font-semibold tracking-tight text-[#F4F4F5]">
                Uploaded Artifacts
              </h2>
              <span className="text-xs text-[#71717A]">{files.length} items</span>
            </div>

            {files.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#71717A]">
                No files uploaded yet.
              </div>
            ) : (
              <ul className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {files.map((f, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-[#27272A] bg-[#18181B] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderFileIcon(f.file.name)}
                        <span className="truncate text-xs font-medium text-[#F4F4F5]" title={f.file.name}>
                          {f.file.name}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(index)}
                        className="p-1 rounded bg-[#27272A] text-[#71717A] hover:text-rose-400 transition shrink-0"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Preview Image if image file */}
                    {f.file.type.startsWith("image") && (
                      <img
                        src={f.preview}
                        alt="preview"
                        className="w-full h-28 object-cover rounded border border-[#27272A]"
                      />
                    )}

                    {/* Progress Bar */}
                    <div className="w-full bg-[#27272A] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#F4F4F5] h-full transition-all duration-200"
                        style={{ width: `${f.progress}%` }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}