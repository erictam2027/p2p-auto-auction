import Image from "next/image";
import Link from "next/link";
import { CountdownTimer } from "@/components/auctions/CountdownTimer";
import { PublishListingButton } from "@/components/dashboard/publish-listing-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";
import { Car } from "lucide-react";

export type DealerVehicleRow = {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  currentBid: number;
  imageUrl: string;
  endTime: string;
  status: "Draft" | "Live" | "Ended";
};

type DealerVehiclesTableProps = {
  vehicles: DealerVehicleRow[];
};

export function DealerVehiclesTable({ vehicles }: DealerVehiclesTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <Car className="mx-auto size-8 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-900">No inventory yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upload your first vehicle to start syndicating listings to the marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead>Image</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>VIN</TableHead>
            <TableHead>Current Bid</TableHead>
            <TableHead>Time Remaining</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
            const isLive = vehicle.status === "Live";
            const isDraft = vehicle.status === "Draft";

            return (
              <TableRow key={vehicle.id} className="border-slate-200">
                <TableCell>
                  <Link href={`/auctions/${vehicle.id}`} className="block">
                    <div className="relative size-12 overflow-hidden rounded border border-slate-200 bg-slate-100">
                      {vehicle.imageUrl ? (
                        <Image
                          src={vehicle.imageUrl}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Car className="size-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/auctions/${vehicle.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {title}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">
                  {vehicle.vin}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  {formatCurrency(vehicle.currentBid * 100)}
                </TableCell>
                <TableCell>
                  {vehicle.endTime ? (
                    <CountdownTimer endTime={vehicle.endTime} />
                  ) : isDraft ? (
                    <span className="text-sm text-slate-500">Not scheduled</span>
                  ) : (
                    <span className="text-sm text-slate-500">Ended</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      isLive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : isDraft
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                    }
                  >
                    {vehicle.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {isDraft ? (
                    <PublishListingButton vehicleId={vehicle.id} />
                  ) : (
                    <Link
                      href={`/auctions/${vehicle.id}`}
                      className="text-sm font-medium text-slate-700 hover:text-slate-950 hover:underline"
                    >
                      View
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
