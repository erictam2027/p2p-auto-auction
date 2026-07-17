import type { WatchlistItem } from "@/lib/data/watchlist";
import Link from "next/link";

function formatMoney(amount: number | null) {
  if (amount == null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProfileWatchlist({ items }: { items: WatchlistItem[] }) {
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
      {items.map((item) => {
        const title = [item.year, item.make, item.model, item.trim]
          .filter(Boolean)
          .join(" ");

        return (
          <li key={item.id}>
            <Link
              href={`/auctions/${item.vehicleId}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded bg-slate-100">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={title}
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {title || "Listing"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.status ?? "unknown"} · Current bid{" "}
                  {formatMoney(item.currentBid)}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
