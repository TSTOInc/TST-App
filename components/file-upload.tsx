"use client";

import * as React from "react"
import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileUpIcon,
  HeadphonesIcon,
  ImageIcon,
  VideoIcon,
  XIcon,
  ChevronDownIcon
} from "lucide-react";

import {
  formatBytes,
  useFileUpload,
} from "../hooks/use-file-upload";
import { Button } from "./ui/button";
import { Field, FieldDescription, FieldLabel } from "./ui/field"
import { Input } from "./ui/input"
import { Calendar } from "./ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

type Category = {
  value: string;
  label: string;
};
export type UploadFile = {
  id: string;
  file: File | { name: string; size: number; type: string };
  category?: Category;
};

/* ---------------- LOGIC HELPERS ---------------- */
function isRealFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Automatically infers a matching category based on keywords inside the filename.
 */
function autoDetectCategory(fileName: string, categories: Category[]): Category | undefined {
  const lowerName = fileName.toLowerCase();

  // 1. Define keyword mapping rules based on your exact values
  let targetValue: string | null = null;

  //Check for Broker-specific documents
  if (lowerName.includes("quickpay") || lowerName.includes("quick-pay")) {
    targetValue = "QUICKPAY_AGREEMENT";
  } else if (lowerName.includes("agreement") || lowerName.includes("contract") || lowerName.includes("broker-carrier")) {
    targetValue = "CARRIER_AGREEMENT";
  }



  //Check for Load-specific documents
  if (lowerName.includes("rate-con") || lowerName.includes("ratecon") || lowerName.includes("confirmation")) {
    targetValue = "RATE_CONFIRMATION";
  } else if (lowerName.includes("bol") || lowerName.includes("lading")) {
    targetValue = "BOL";
  } else if (lowerName.includes("pod") || lowerName.includes("delivery")) {
    targetValue = "POD";
  } else if (lowerName.includes("innout") || lowerName.includes("in-out") || lowerName.includes("ticket")) {
    // Check ticket variations
    if (lowerName.includes("lumper")) {
      targetValue = "LUMPER";
    } else if (lowerName.includes("scale")) {
      targetValue = "SCALE_TICKET";
    } else if (lowerName.includes("in") || lowerName.includes("out")) {
      targetValue = "INNOUT_TICKET";
    }
  } else if (lowerName.includes("interchange") || lowerName.includes("trailer")) {
    targetValue = "TRAILER_INTERCHANGE";
  }

  // 2. Find the actual category object from your provided array
  if (targetValue) {
    const matched = categories.find(c => c.value === targetValue);
    if (matched) return matched;
  }

  // 3. Fall back to "Other" (MISC) if it exists in your list, otherwise undefined
  return categories.find(c => c.value === "MISC");
}

/* ---------------- ICON LOGIC ---------------- */
const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type;
  const fileName = file.file instanceof File ? file.file.name : file.file.name;

  if (
    fileType.includes("pdf") ||
    fileName.endsWith(".pdf") ||
    fileType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return <FileTextIcon className="size-4 opacity-60" />;
  }
  if (
    fileType.includes("zip") ||
    fileType.includes("archive") ||
    fileName.endsWith(".zip") ||
    fileName.endsWith(".rar")
  ) {
    return <FileArchiveIcon className="size-4 opacity-60" />;
  }
  if (
    fileType.includes("excel") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) {
    return <FileSpreadsheetIcon className="size-4 opacity-60" />;
  }
  if (fileType.includes("video/")) {
    return <VideoIcon className="size-4 opacity-60" />;
  }
  if (fileType.includes("audio/")) {
    return <HeadphonesIcon className="size-4 opacity-60" />;
  }
  if (fileType.startsWith("image/")) {
    return <ImageIcon className="size-4 opacity-60" />;
  }
  return <FileIcon className="size-4 opacity-60" />;
};

/* ---------------- COMPONENT ---------------- */
export default function FileUpload({
  maxFiles = 10,
  maxSizeMB = 10,
  multiple = true,
  expires = false,
  perFile = false,
  categories = [],
  onFilesChange,
  onExpireChange,
}: {
  maxFiles?: number;
  maxSizeMB?: number;
  multiple?: boolean;
  expires?: boolean;
  perFile?: boolean;
  categories?: Category[];
  onFilesChange?: (files: UploadFile[]) => void;
  onExpireChange?: (date?: Date) => void;
}) {
  const maxSize = maxSizeMB * 1024 * 1024;

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    multiple,
  });

  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date>()
  const [fileCategories, setFileCategories] = useState<Record<string, Category>>({});

  const categoryOptions = categories;

  /* AUTO-DETECT CATEGORIES WHEN NEW FILES ARE ADDED */
  useEffect(() => {
    if (!perFile || categoryOptions.length === 0) return;

    setFileCategories((prev) => {
      let updated = false;
      const next = { ...prev };

      files.forEach((f) => {
        // If this file item doesn't have a category assigned yet
        if (!next[f.id]) {
          const fileName = f.file instanceof File ? f.file.name : f.file.name;
          const detected = autoDetectCategory(fileName, categoryOptions);

          // Use auto-detected match, or fall back to the first available category option
          next[f.id] = detected || categoryOptions[0];
          updated = true;
        }
      });

      return updated ? next : prev;
    });
  }, [files, categoryOptions, perFile]);

  /* SYNC FILES TO PARENT */
  useEffect(() => {
    if (!onFilesChange) return;

    const filesWithCategory: UploadFile[] = files.map((f) => ({
      id: f.id,
      file: f.file,
      category: perFile ? fileCategories[f.id] || categoryOptions[0] : undefined,
    }));

    onFilesChange(filesWithCategory);
  }, [files, fileCategories, perFile, onFilesChange, categoryOptions]);

  /* SYNC EXPIRE DATE TO PARENT */
  useEffect(() => {
    if (!onExpireChange) return;
    onExpireChange(date);
  }, [date, onExpireChange]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Drop area */}
      <div
        className="cursor-pointer flex min-h-40 flex-col items-center justify-center rounded-xl border border-input border-dashed p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-[input:focus]:border-ring has-disabled:opacity-50 has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
        data-dragging={isDragging || undefined}
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={-1}
      >
        <input
          {...getInputProps()}
          aria-label="Upload files"
          className="sr-only"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
          >
            <FileUpIcon className="size-4 opacity-60" />
          </div>
          <p className="mb-1.5 font-medium text-sm">Upload file{multiple ? "s" : ""}</p>
          <p className="mb-2 text-muted-foreground text-xs">
            Drag & drop or click to browse
          </p>
          <div className="flex flex-wrap justify-center gap-1 text-muted-foreground/70 text-xs">
            <span>All files</span>
            <span>∙</span>
            <span>{multiple ? "Up to " : ""}{multiple ? maxFiles : 1} file{multiple ? "s" : ""}</span>
            <span>∙</span>
            <span>Up to {formatBytes(maxSize)}</span>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          className="flex items-center gap-1 text-destructive text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <>
          <div className="space-y-2 max-w-full">
            {files.map((file) => {
              const selected = fileCategories[file.id] || categoryOptions[0];
              return (
                <div
                  className="flex items-center justify-between gap-4 rounded-lg border bg-background p-2 pr-3 w-full"
                  key={file.id}
                >
                  {/* Left Column: Icon + Name Info Wrapper */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border bg-muted/40">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                      <p className="max-w-[130px] sm:max-w-[300px] truncate font-medium text-[13px]">
                        {file.file instanceof File ? file.file.name : file.file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatBytes(file.file instanceof File ? file.file.size : file.file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Actions (Dropdown select + close clear button) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {perFile && categoryOptions.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 gap-1 min-w-[110px] justify-between">
                            <span className="truncate">{selected?.label}</span>
                            <ChevronDownIcon className="size-3.5 opacity-60 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          {categoryOptions.map((option) => (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              key={option.value}
                              onClick={() =>
                                setFileCategories((prev) => ({
                                  ...prev,
                                  [file.id]: option,
                                }))
                              }
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <Button
                      aria-label="Remove file"
                      className="size-8 text-muted-foreground/80 hover:bg-accent hover:text-foreground shrink-0"
                      onClick={() => removeFile(file.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <XIcon aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

            {files.length > 1 && (
              <div className="pt-1">
                <Button onClick={clearFiles} size="sm" variant="outline" className="text-xs">
                  Remove all files
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2">
            {expires && (
              <Field className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="date" className="text-xs font-medium">Expires on</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className="w-full sm:w-[240px] justify-start text-left font-normal h-9 text-sm"
                    >
                      {date ? date.toLocaleDateString() : <span className="text-muted-foreground">Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      defaultMonth={date}
                      captionLayout="dropdown"
                      startMonth={new Date(new Date().getFullYear(), 0)}
                      endMonth={new Date(new Date().getFullYear() + 15, 11)}
                      onSelect={(date) => {
                        setDate(date)
                        setOpen(false)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            )}
          </div>
        </>
      )}
    </div>
  );
}