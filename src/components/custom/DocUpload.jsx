import React, { useState } from "react";
import { IconFile, IconUpload } from "@tabler/icons-react";

export default function DocumentDropzone({ onChange, disabled = false }) {
  const [fileInfo, setFileInfo] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return; // prevent dropping when disabled
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileInfo({ name: file.name });
      if (onChange) onChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setDragOver(true);
  };

  const handleDragLeave = () => {
    if (!disabled) setDragOver(false);
  };

  const handleClick = () => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.txt";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFileInfo({ name: file.name });
        if (onChange) onChange(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          ${fileInfo ? "border" : "border-dashed"}
          w-1/3 min-w-[250px] aspect-square border-2 rounded-lg flex flex-col items-center justify-center p-4
          ${dragOver ? "border-blue-400 bg-blue-950" : "border-neutral-400 bg-neutral-900"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {!fileInfo ? (
          <>
            <IconUpload size={48} />
            <span className="mt-2 text-center text-muted-foreground">
              {disabled ? "Uploading in progress..." : "Drag & drop a document or click to upload"}
            </span>
          </>
        ) : (
          <>
            <IconFile size={48} />
            <span className="mt-2 text-center break-words">{fileInfo.name}</span>
          </>
        )}
      </div>
    </div>
  );
}
