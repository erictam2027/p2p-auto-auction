"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dealerProfileDefaults } from "@/lib/data/dealer-dashboard";
import { useState } from "react";

export function DealerSettingsForm() {
  const [legalName, setLegalName] = useState(dealerProfileDefaults.legalName);
  const [licenseNumber, setLicenseNumber] = useState(
    dealerProfileDefaults.licenseNumber,
  );
  const [businessAddress, setBusinessAddress] = useState(
    dealerProfileDefaults.businessAddress,
  );
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form
      onSubmit={handleSubmit}
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
        <label htmlFor="business-address" className="text-sm font-medium text-slate-900">
          Business Address
        </label>
        <Input
          id="business-address"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          className="h-11 border-slate-300 bg-white text-slate-900"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <Button
          type="submit"
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          Save Changes
        </Button>
        {saved ? (
          <p className="text-sm text-slate-600">Profile updated successfully.</p>
        ) : null}
      </div>
    </form>
  );
}
