"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CloudUpload, Link2 } from "lucide-react";
import { useRef, useState } from "react";

const INTEGRATIONS = [
  {
    id: "vauto",
    name: "vAuto",
    description: "Sync inventory directly from your vAuto Provision account.",
  },
  {
    id: "dealersocket",
    name: "DealerSocket",
    description: "Automated daily feed from DealerSocket CRM.",
  },
  {
    id: "homenet",
    name: "HomeNet",
    description: "Pull listings and media from HomeNet Automotive.",
  },
] as const;

export function BulkInventoryUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFile(file: File | null) {
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 transition-colors sm:py-20",
          isDragging
            ? "border-slate-900 bg-slate-50"
            : "border-slate-300 bg-white hover:border-slate-400",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="sr-only"
        />

        <div className="flex size-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <CloudUpload className="size-7 text-slate-500" />
        </div>

        {selectedFile ? (
          <>
            <p className="mt-5 text-sm font-medium text-slate-900">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-slate-600">
              {(selectedFile.size / 1024).toFixed(1)} KB · Ready to parse
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              >
                Replace File
              </Button>
              <Button className="bg-slate-900 text-white hover:bg-slate-800">
                Process CSV
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-base font-medium text-slate-900">
              Drag and drop your CSV file here
            </p>
            <p className="mt-1 text-sm text-slate-600">
              or select a file from your computer
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 bg-slate-900 text-white hover:bg-slate-800"
            >
              Select CSV File
            </Button>
          </>
        )}
      </div>

      {/* Integration options */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Direct API Integrations
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Automated sync — coming soon. Connect your DMS for hands-free inventory updates.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {INTEGRATIONS.map(({ id, name, description }) => (
            <article
              key={id}
              className="flex flex-col rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <Link2 className="size-4 text-slate-600" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                Connect {name}
              </h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">
                {description}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="mt-4 w-full border-slate-300 bg-white text-slate-600"
              >
                Coming Soon
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
