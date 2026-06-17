import Link from "next/link";

export default function AuctionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Live Auctions</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Browse verified peer-to-peer vehicle auctions.
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
        No active auctions yet. Listings will appear here once sellers complete
        verification.
      </section>

      <Link href="/" className="text-sm text-zinc-600 underline-offset-4 hover:underline">
        Back to home
      </Link>
    </main>
  );
}
