"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  parseInventoryCsv,
  readCsvFile,
  type ParsedInventoryVehicle,
} from "@/lib/utils/parse-inventory-csv";
import { formatMileage } from "@/lib/utils/format";
import { CloudUpload, Link2, Loader2 } from "lucide-react";
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

const PREVIEW_ROW_LIMIT = 5;

type UploadStage = "dropzone" | "staging" | "success";

function mockImportVehicles(vehicles: ParsedInventoryVehicle[]): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(vehicles.length), 1200);
  });
}

function StagingPreviewTable({ rows }: { rows: ParsedInventoryVehicle[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-medium text-slate-600">VIN</th>
              <th className="px-4 py-3 font-medium text-slate-600">Year</th>
              <th className="px-4 py-3 font-medium text-slate-600">Make</th>
              <th className="px-4 py-3 font-medium text-slate-600">Model</th>
              <th className="px-4 py-3 font-medium text-slate-600">Mileage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.vin} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-mono text-xs text-slate-900">{row.vin}</td>
                <td className="px-4 py-3 text-slate-900">{row.year}</td>
                <td className="px-4 py-3 text-slate-900">{row.make}</td>
                <td className="px-4 py-3 text-slate-900">{row.model}</td>
                <td className="px-4 py-3 text-slate-700">
                  {Number.isNaN(Number(row.mileage.replace(/,/g, "")))
                    ? row.mileage
                    : `${formatMileage(Number(row.mileage.replace(/,/g, "")))} mi`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BulkInventoryUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<UploadStage>("dropzone");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedVehicles, setParsedVehicles] = useState<ParsedInventoryVehicle[]>([]);
  const [draftCount, setDraftCount] = useState(0);

  function resetUpload() {
    setStage("dropzone");
    setIsParsing(false);
    setIsConfirming(false);
    setParseError(null);
    setSelectedFile(null);
    setParsedVehicles([]);
    setDraftCount(0);
    setConfirmError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function processFile(file: File | null) {
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please upload a valid .csv file.");
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const text = await readCsvFile(file);
      const vehicles = parseInventoryCsv(text);

      if (vehicles.length === 0) {
        throw new Error("No valid vehicle rows found in CSV.");
      }

      setSelectedFile(file);
      setParsedVehicles(vehicles);
      setStage("staging");
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Failed to parse CSV file.",
      );
    } finally {
      setIsParsing(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    void processFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    void processFile(e.dataTransfer.files?.[0] ?? null);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleConfirm() {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const importedCount = await mockImportVehicles(parsedVehicles);
      setDraftCount(importedCount);
      setStage("success");
    } catch (error) {
      setConfirmError(
        error instanceof Error ? error.message : "Failed to import vehicles.",
      );
    } finally {
      setIsConfirming(false);
    }
  }

  const previewRows = parsedVehicles.slice(0, PREVIEW_ROW_LIMIT);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleInputChange}
        className="sr-only"
      />

      {stage === "dropzone" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 transition-colors sm:py-20",
            isDragging
              ? "border-slate-900 bg-slate-50"
              : "border-slate-300 bg-white hover:border-slate-400",
            isParsing && "pointer-events-none opacity-70",
          )}
        >
          <div className="flex size-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
            {isParsing ? (
              <Loader2 className="size-7 animate-spin text-slate-500" />
            ) : (
              <CloudUpload className="size-7 text-slate-500" />
            )}
          </div>

          <p className="mt-5 text-base font-medium text-slate-900">
            {isParsing ? "Parsing CSV…" : "Drag and drop your CSV file here"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {isParsing
              ? "Mapping VIN, Year, Make, Model, and Mileage columns"
              : "or select a file from your computer"}
          </p>

          {!isParsing && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 bg-slate-900 text-white hover:bg-slate-800"
            >
              Select CSV File
            </Button>
          )}

          {parseError && (
            <p className="mt-4 max-w-md text-center text-sm text-red-600">{parseError}</p>
          )}
        </div>
      )}

      {stage === "staging" && selectedFile && (
        <section className="space-y-6">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Staging Preview</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Review the first {PREVIEW_ROW_LIMIT} rows from{" "}
                  <span className="font-medium text-slate-900">{selectedFile.name}</span>{" "}
                  before generating draft auctions.
                </p>
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {parsedVehicles.length}
                </span>{" "}
                vehicles mapped
              </p>
            </div>
          </div>

          <StagingPreviewTable rows={previewRows} />

          {parsedVehicles.length > PREVIEW_ROW_LIMIT && (
            <p className="text-center text-xs text-slate-600">
              Showing {PREVIEW_ROW_LIMIT} of {parsedVehicles.length} vehicles
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {confirmError && (
              <p className="flex-1 self-center text-sm text-red-600 sm:order-first sm:text-left">
                {confirmError}
              </p>
            )}
            <Button
              variant="outline"
              onClick={resetUpload}
              disabled={isConfirming}
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            >
              Cancel / Re-upload
            </Button>
            <Button
              onClick={() => void handleConfirm()}
              disabled={isConfirming}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating Drafts…
                </>
              ) : (
                "Confirm & Generate Drafts"
              )}
            </Button>
          </div>
        </section>
      )}

      {stage === "success" && (
        <section className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            {draftCount} draft auction{draftCount === 1 ? "" : "s"} generated
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Your inventory has been staged and is ready for review in the dealer portal.
          </p>
          <Button
            onClick={resetUpload}
            className="mt-6 bg-slate-900 text-white hover:bg-slate-800"
          >
            Upload Another File
          </Button>
        </section>
      )}

      {stage === "dropzone" && (
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
      )}
    </div>
  );
}
