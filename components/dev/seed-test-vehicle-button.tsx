"use client";

import { seedTestLandRover } from "@/app/actions/seed-test-vehicle";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/** Temporary local-dev control — remove before production launch. */
export function SeedTestVehicleButton() {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);

  async function handleSeed() {
    setIsSeeding(true);

    const result = await seedTestLandRover();

    setIsSeeding(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(`Seeded 2023 Land Rover Defender (${result.vehicleId})`);
    router.refresh();
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-amber-900">
          Dev only: seed a live 2023 Land Rover Defender ($65,000) to test bidding.
        </p>
        <Button
          type="button"
          size="sm"
          disabled={isSeeding}
          onClick={() => void handleSeed()}
          className="bg-amber-900 text-white hover:bg-amber-800"
        >
          {isSeeding ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Seeding…
            </>
          ) : (
            "Seed Test Land Rover"
          )}
        </Button>
      </div>
    </div>
  );
}
