type AuctionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm text-zinc-500">Auction #{id}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Vehicle Listing
        </h1>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
        Listing detail modules (Known Flaws, Recent Service, Modifications,
        Equipment) will render here.
      </section>
    </main>
  );
}
