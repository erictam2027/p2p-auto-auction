import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvLocal() {
  try {
    const envPath = join(rootDir, ".env.local");
    const contents = readFileSync(envPath, "utf8");

    for (const line of contents.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...rest] = trimmed.split("=");
      const value = unquoteEnvValue(rest.join("=").trim());

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional when env vars are already exported
  }
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function readProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = supabaseUrl.match(/^https?:\/\/([^.]+)\.supabase\.co\/?$/);

  return match?.[1] ?? null;
}

async function parseDatabaseUrl(databaseUrl) {
  const { parse } = await import("pg-connection-string");
  return parse(databaseUrl);
}

function buildDirectDatabaseUrl(parsed, projectRef) {
  if (!parsed.password || !projectRef) {
    return null;
  }

  const encodedPassword = encodeURIComponent(parsed.password);

  return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
}

async function checkSchema(supabase) {
  const checks = {
    closeExpiredAuctionsRpc: false,
    atomicBiddingRpc: false,
    escrowTransactionsTable: false,
    vehiclesWinnerId: false,
    vehicleImageUrls: false,
    bidsUserId: false,
  };

  const { error: rpcError } = await supabase.rpc("close_expired_auctions");
  checks.closeExpiredAuctionsRpc = !rpcError;

  const { error: biddingRpcError } = await supabase
    .rpc("place_bid_atomic", {
      p_vehicle_id: "00000000-0000-0000-0000-000000000000",
      p_bidder_id: "00000000-0000-0000-0000-000000000000",
      p_amount: 100,
      p_min_increment: 100,
      p_snipe_extension_seconds: 120,
    });
  checks.atomicBiddingRpc =
    !biddingRpcError ||
    (
      biddingRpcError.code !== "PGRST202" &&
      !/could not find the function|function .* does not exist/i.test(
        biddingRpcError.message ?? "",
      )
    );

  const { error: escrowError } = await supabase.from("escrow_transactions").select("id").limit(1);
  checks.escrowTransactionsTable = !escrowError;

  const { error: vehicleError } = await supabase.from("vehicles").select("winner_id").limit(1);
  checks.vehiclesWinnerId = !vehicleError;

  const { error: imageUrlsError } = await supabase
    .from("vehicles")
    .select("image_urls")
    .limit(1);
  checks.vehicleImageUrls = !imageUrlsError;

  const { error: bidsError } = await supabase.from("bids").select("user_id").limit(1);
  checks.bidsUserId = !bidsError;

  return checks;
}

async function checkSchemaViaPg(databaseUrl) {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const checks = {
    closeExpiredAuctionsRpc: false,
    atomicBiddingRpc: false,
    escrowTransactionsTable: false,
    vehiclesWinnerId: false,
    vehicleImageUrls: false,
    bidsUserId: false,
  };

  const rpcRows = await client.query(
    "SELECT to_regprocedure('public.close_expired_auctions()') IS NOT NULL AS ok",
  );
  const biddingRpcRows = await client.query(
    "SELECT to_regprocedure('public.place_bid_atomic(uuid, uuid, integer, integer, integer)') IS NOT NULL AS ok",
  );
  const escrowRows = await client.query(
    "SELECT to_regclass('public.escrow_transactions') IS NOT NULL AS ok",
  );
  const winnerRows = await client.query(
    "SELECT COUNT(*)::int AS ok FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'winner_id'",
  );
  const imageUrlsRows = await client.query(
    "SELECT COUNT(*)::int AS ok FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'image_urls'",
  );
  const bidRows = await client.query(
    "SELECT COUNT(*)::int AS ok FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bids' AND column_name = 'user_id'",
  );

  checks.closeExpiredAuctionsRpc = Boolean(rpcRows.rows[0]?.ok);
  checks.atomicBiddingRpc = Boolean(biddingRpcRows.rows[0]?.ok);
  checks.escrowTransactionsTable = Boolean(escrowRows.rows[0]?.ok);
  checks.vehiclesWinnerId = Number(winnerRows.rows[0]?.ok) > 0;
  checks.vehicleImageUrls = Number(imageUrlsRows.rows[0]?.ok) > 0;
  checks.bidsUserId = Number(bidRows.rows[0]?.ok) > 0;

  await client.end();

  return checks;
}

/** @returns {Promise<string>} */
async function applyWithPg(databaseUrl) {
  const { Client } = await import("pg");
  const parsed = await parseDatabaseUrl(databaseUrl);
  const projectRef = readProjectRef();
  const candidates = [databaseUrl];

  const directUrl = buildDirectDatabaseUrl(parsed, projectRef);

  if (directUrl && directUrl !== databaseUrl) {
    candidates.push(directUrl);
  }

  /** @type {Error | null} */
  let lastError = null;

  for (const [index, candidateUrl] of candidates.entries()) {
    const label = index === 0 ? "primary" : "direct-fallback";
    const client = new Client({
      connectionString: candidateUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();

      const migrationFiles = [
        join(rootDir, "supabase/APPLY_ALL_MIGRATIONS.sql"),
        join(rootDir, "supabase/migrations/20260716000000_production_completion.sql"),
        join(rootDir, "supabase/migrations/20260716120000_finalize_auction_close.sql"),
        join(rootDir, "supabase/migrations/20260716130000_vehicles_seller_and_core_columns.sql"),
        join(rootDir, "supabase/migrations/20260716140000_grant_api_roles.sql"),
        join(rootDir, "supabase/migrations/20260717180000_atomic_bidding_rpc.sql"),
        join(rootDir, "supabase/migrations/20260718110000_vehicle_image_gallery.sql"),
      ];

      for (const migrationFile of migrationFiles) {
        const sql = readFileSync(migrationFile, "utf8");
        console.log(`Applying ${migrationFile.replace(`${rootDir}/`, "")}...`);
        await client.query(sql);
      }

      await client.query("NOTIFY pgrst, 'reload schema';");
      await client.end();

      if (label === "direct-fallback") {
        console.log("Connected via direct database URL fallback (pooler URL did not work).");
        console.log(
          `Tip: set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.${projectRef}.supabase.co:5432/postgres`,
        );
      }

      return candidateUrl;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await client.end().catch(() => {});
    }
  }

  throw lastError ?? new Error("Unable to connect to Postgres.");
}

async function main() {
  loadEnvLocal();

  const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
  /** @type {string | null} */
  let verifiedDatabaseUrl = null;

  if (databaseUrl) {
    console.log("Applying migrations via DATABASE_URL...");
    verifiedDatabaseUrl = await applyWithPg(databaseUrl);
    console.log("Migrations applied.");
  } else {
    console.log("DATABASE_URL not set — skipping automatic SQL apply.");
    console.log("Add DATABASE_URL to .env.local or run the SQL files in Supabase SQL editor.");
  }

  const checks = verifiedDatabaseUrl
    ? await checkSchemaViaPg(verifiedDatabaseUrl)
    : await checkSchema(getAdminClient());

  console.log("\nSchema verification:");
  for (const [key, value] of Object.entries(checks)) {
    console.log(`  ${key}: ${value ? "ok" : "MISSING"}`);
  }

  const allGood = Object.values(checks).every(Boolean);

  if (!allGood) {
    process.exitCode = 1;
    console.error("\nSome schema checks failed.");
    console.error("Open Supabase SQL editor and run: supabase/APPLY_ALL_MIGRATIONS.sql");
    console.error("Or set DATABASE_URL in .env.local and re-run: npm run setup:db");
    return;
  }

  console.log("\nDatabase schema is ready.");

  const cronSecret = process.env.CRON_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (cronSecret) {
    try {
      const response = await fetch(`${appUrl}/api/cron/close-auctions`, {
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      const payload = await response.json();
      console.log("\nCron smoke test:", response.status, payload);
    } catch {
      console.warn("\nCron smoke test skipped (dev server may be offline).");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
