import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function loadEnvLocal() {
  const envPath = join(rootDir, ".env.local");
  const contents = readFileSync(envPath, "utf8");

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    process.env[key] = rest.join("=").trim();
  }
}

async function main() {
  loadEnvLocal();

  const cronSecret = process.env.CRON_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!cronSecret) {
    throw new Error("CRON_SECRET is not configured.");
  }

  const response = await fetch(`${appUrl}/api/cron/close-auctions`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const payload = await response.json();
  console.log(response.status, payload);

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
