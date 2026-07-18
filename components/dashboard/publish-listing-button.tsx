"use client";

import { publishListing } from "@/app/dashboard/auction-actions";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type PublishListingButtonProps = {
  vehicleId: string;
};

export function PublishListingButton({ vehicleId }: PublishListingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePublish() {
    startTransition(async () => {
      const result = await publishListing(vehicleId);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={handlePublish}
      className="bg-slate-900 text-white hover:bg-slate-800"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      {isPending ? "Publishing" : "Publish"}
    </Button>
  );
}
