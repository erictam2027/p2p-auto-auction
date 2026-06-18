"use client";

import { updateDealerSettings } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type DealerSettingsFormProps = {
  dealershipName: string;
  dealerLicense: string;
  phone: string;
};

export function DealerSettingsForm({
  dealershipName,
  dealerLicense,
  phone,
}: DealerSettingsFormProps) {
  const [legalName, setLegalName] = useState(dealershipName);
  const [licenseNumber, setLicenseNumber] = useState(dealerLicense);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await updateDealerSettings({
      dealershipName: legalName,
      dealerLicense: licenseNumber,
      phone: phoneNumber,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Dealership profile updated successfully.");
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="max-w-2xl space-y-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <label htmlFor="legal-name" className="text-sm font-medium text-slate-900">
          Dealership Legal Name
        </label>
        <Input
          id="legal-name"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          className="h-11 border-slate-300 bg-white text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="license-number" className="text-sm font-medium text-slate-900">
          State Dealer License Number
        </label>
        <Input
          id="license-number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          className="h-11 border-slate-300 bg-white text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone-number" className="text-sm font-medium text-slate-900">
          Business Phone
        </label>
        <Input
          id="phone-number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="h-11 border-slate-300 bg-white text-slate-900"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
