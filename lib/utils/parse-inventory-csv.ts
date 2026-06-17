export type ParsedInventoryVehicle = {
  vin: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
};

const REQUIRED_HEADERS = ["vin", "year", "make", "model", "mileage"] as const;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "");
}

export function parseInventoryCsv(text: string): ParsedInventoryVehicle[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one vehicle.");
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const headerIndex = Object.fromEntries(
    headers.map((header, index) => [header, index]),
  ) as Record<string, number>;

  for (const required of REQUIRED_HEADERS) {
    if (headerIndex[required] === undefined) {
      throw new Error(`Missing required column: ${required.toUpperCase()}`);
    }
  }

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);

    return {
      vin: cells[headerIndex.vin] ?? "",
      year: cells[headerIndex.year] ?? "",
      make: cells[headerIndex.make] ?? "",
      model: cells[headerIndex.model] ?? "",
      mileage: cells[headerIndex.mileage] ?? "",
    };
  }).filter((row) => row.vin.length > 0);
}

export function readCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read file contents."));
    };

    reader.onerror = () => {
      reject(new Error("Failed to read CSV file."));
    };

    reader.readAsText(file);
  });
}
