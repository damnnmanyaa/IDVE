import { useState } from "react";

export default function Upload() {
  const [files, setFiles] = useState([]);

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    fileArray.forEach((f, i) => simulateProgress(f, i));

    setFiles((prev) => [...prev, ...fileArray]);
  };

  const simulateProgress = (fileObj, index) => {
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
    }, 200);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (name) => {
    if (name.endsWith(".pdf")) return "📄";
    if (name.match(/\.(jpg|jpeg|png)$/)) return "🖼️";
    return "📁";
  };

  return (
    <div className="ui-page">
      <div className="mx-auto max-w-6xl">
        <h1 className="ui-page-title mb-6">Upload Documents</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">

        {/* Drag & Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="ui-card flex min-h-72 flex-col items-center justify-center border-2 border-dashed border-blue-300 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50 sm:p-10"
        >
          <div className="text-blue-500 text-4xl mb-4">⬆️</div>

          <p className="font-medium text-lg">
            Drag and drop files to upload
          </p>

          <p className="my-2 text-gray-600">or</p>

          <label className="ui-button-primary cursor-pointer">
            Browse
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>

          <p className="mt-3 text-sm text-gray-600">
            Supported files: JPG, PNG, PDF
          </p>
        </div>

        {/* File List */}
        <div className="ui-card p-5 sm:p-6">

          <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">
            Uploaded Files
          </h2>

          {files.length === 0 ? (
            <p className="text-gray-600">No files uploaded yet.</p>
          ) : (
            <ul className="space-y-4">
              {files.map((f, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span>{getFileIcon(f.file.name)}</span>
                      <span className="min-w-0 truncate text-sm text-gray-800" title={f.file.name}>{f.file.name}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(index)}
                      className="ui-button-secondary ui-danger-muted h-10 w-10 shrink-0 p-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preview */}
                  {f.file.type.startsWith("image") && (
                    <img
                      src={f.preview}
                      alt="preview"
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="ui-progress h-2 rounded transition-all"
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