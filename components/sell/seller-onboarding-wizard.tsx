"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileSearch,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    id: 1,
    title: "VIN Verification",
    description: "Federal title history check",
  },
  {
    id: 2,
    title: "Legit Check Inspection",
    description: "Certified mobile inspection",
  },
  {
    id: 3,
    title: "Secure Escrow Onboarding",
    description: "Identity & payout setup",
  },
] as const;

const TIME_SLOTS = [
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
];

function buildUpcomingDates(count: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let offset = 1;
  while (dates.length < count) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    offset += 1;
    if (candidate.getDay() !== 0 && candidate.getDay() !== 6) {
      dates.push(candidate);
    }
  }

  return dates;
}

const UPCOMING_DATES = buildUpcomingDates(10);

function formatDateLabel(date: Date): { weekday: string; day: string; month: string } {
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.toLocaleDateString("en-US", { day: "numeric" }),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function StepIndicator({
  step,
  currentStep,
  isComplete,
}: {
  step: (typeof STEPS)[number];
  currentStep: number;
  isComplete: boolean;
}) {
  const isActive = step.id === currentStep;
  const isPast = step.id < currentStep || isComplete;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
            isPast
              ? "border-slate-900 bg-slate-900 text-white"
              : isActive
                ? "border-slate-900 bg-white text-slate-900"
                : "border-slate-200 bg-white text-slate-400",
          )}
        >
          {isPast && step.id < currentStep ? (
            <Check className="size-4" />
          ) : (
            step.id
          )}
        </div>
        {step.id < STEPS.length && (
          <div
            className={cn(
              "my-1 w-px flex-1 min-h-8",
              step.id < currentStep ? "bg-slate-900" : "bg-slate-200",
            )}
          />
        )}
      </div>
      <div className="pb-8 pt-1">
        <p
          className={cn(
            "text-sm font-semibold",
            isActive || isPast ? "text-slate-900" : "text-slate-400",
          )}
        >
          {step.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">{step.description}</p>
      </div>
    </div>
  );
}

function VinVerificationStep({
  vin,
  onVinChange,
}: {
  vin: string;
  onVinChange: (value: string) => void;
}) {
  return (
    <>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <FileSearch className="size-5 text-slate-600" />
          </span>
          <div>
            <CardTitle className="text-lg text-slate-900">Step 1: VIN Verification</CardTitle>
            <CardDescription className="text-slate-600">
              Enter your 17-character Vehicle Identification Number to begin certification.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <label htmlFor="vin" className="text-sm font-medium text-slate-900">
            Vehicle Identification Number (VIN)
          </label>
          <Input
            id="vin"
            value={vin}
            onChange={(e) => onVinChange(e.target.value.toUpperCase())}
            placeholder="e.g. 1HGBH41JXMN109186"
            maxLength={17}
            className="h-14 border-slate-300 bg-white px-4 font-mono text-lg tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal md:text-lg"
          />
          <p className="text-xs text-slate-600">
            {vin.length}/17 characters · Found on your driver-side door jamb or title document
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-slate-600" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                Mandatory NMVTIS Background Check
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Before any vehicle is listed on ApexAuction, we run a mandatory federal
                NMVTIS (National Motor Vehicle Title Information System) background check.
                This verifies title history, odometer readings, and flags severe brands
                including salvage, flood, and total-loss designations. Listings that fail
                this check are permanently rejected to protect marketplace integrity.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  Title History
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  Odometer Verification
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  Brand Screening
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}

function InspectionStep({
  selectedDate,
  selectedTime,
  location,
  onDateChange,
  onTimeChange,
  onLocationChange,
}: {
  selectedDate: string | null;
  selectedTime: string | null;
  location: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}) {
  return (
    <>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <Wrench className="size-5 text-slate-600" />
          </span>
          <div>
            <CardTitle className="text-lg text-slate-900">
              Step 2: Schedule Legit Check Inspection
            </CardTitle>
            <CardDescription className="text-slate-600">
              Book a certified mobile inspection at your location.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            The StockX Model for Cars
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            ApexAuction operates on an authentication-first model. A certified mobile
            mechanic from our Lemon Squad partner network will come directly to your
            location to perform a comprehensive 78-point inspection, capture
            professional listing photography, and generate a Buyer Guarantee report.
            Verified condition documentation consistently drives higher final auction
            prices and reduces post-sale disputes.
          </p>
          <ul className="mt-4 space-y-2">
            {[
              { icon: Wrench, text: "78-point mechanical inspection at your location" },
              { icon: Camera, text: "Professional photos for your listing" },
              { icon: ClipboardCheck, text: "Buyer Guarantee report attached to auction" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-sm text-slate-600">
                <Icon className="size-4 shrink-0 text-slate-500" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-900">Select inspection date</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {UPCOMING_DATES.map((date) => {
              const iso = date.toISOString().split("T")[0];
              const { weekday, day, month } = formatDateLabel(date);
              const isSelected = selectedDate === iso;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onDateChange(iso)}
                  className={cn(
                    "flex flex-col items-center rounded-md border px-2 py-3 text-center transition-colors",
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-400",
                  )}
                >
                  <span className="text-[10px] font-medium uppercase">{weekday}</span>
                  <span className="text-lg font-semibold leading-tight">{day}</span>
                  <span className="text-[10px]">{month}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-900">Select time window</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeChange(slot)}
                className={cn(
                  "rounded-md border px-4 py-2.5 text-left text-sm transition-colors",
                  selectedTime === slot
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-slate-500" />
            <label htmlFor="inspection-location" className="text-sm font-medium text-slate-900">
              Inspection location
            </label>
          </div>
          <Input
            id="inspection-location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Street address, city, state, ZIP"
            className="h-11 border-slate-300 bg-white text-slate-900"
          />
          <p className="text-xs text-slate-600">
            The inspector will come to this address. Vehicle must be accessible and operable.
          </p>
        </div>
      </CardContent>
    </>
  );
}

function EscrowStep() {
  return (
    <>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <ShieldCheck className="size-5 text-slate-600" />
          </span>
          <div>
            <CardTitle className="text-lg text-slate-900">
              Step 3: Secure Escrow Onboarding
            </CardTitle>
            <CardDescription className="text-slate-600">
              Complete identity verification and connect your payout account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-md border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  KS
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">KeySavvy</p>
                <p className="text-sm text-slate-600">
                  Licensed dealer escrow & title clearing partner
                </p>
              </div>
            </div>
            <Badge variant="outline" className="w-fit border-slate-200 text-slate-700">
              Official Escrow Partner
            </Badge>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            All ApexAuction transactions are processed through KeySavvy, a licensed
            motor vehicle dealer. Before your auction goes live, your identity must be
            verified via biometric ID check, and your payout details must be linked to
            a KeySavvy escrow account. Buyer funds are held in a licensed dealer escrow
            account until title transfer is complete — protecting both parties and
            enabling federal EV tax credit eligibility where applicable.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-900">Required before listing goes live</p>
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
            {[
              {
                title: "Government ID & selfie verification",
                detail: "Biometric identity check via Persona",
              },
              {
                title: "KeySavvy seller account setup",
                detail: "Licensed dealer escrow profile creation",
              },
              {
                title: "Payout method linking",
                detail: "Bank account verification for disbursement",
              },
              {
                title: "Title document upload",
                detail: "Current title or lien payoff authorization",
              },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-3 bg-white px-4 py-3">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-relaxed text-slate-600">
            By continuing, you authorize ApexAuction to share your verification data with
            KeySavvy and Persona solely for identity confirmation and escrow account
            provisioning. Your auction will remain in draft status until all three
            certification steps are complete.
          </p>
        </div>
      </CardContent>
    </>
  );
}

export function SellerOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [vin, setVin] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [location, setLocation] = useState("");

  const canProceedStep1 = vin.length === 17;
  const canProceedStep2 =
    selectedDate !== null && selectedTime !== null && location.trim().length > 0;

  function handleNext() {
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  const isLastStep = currentStep === 3;

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
      {/* Timeline sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-600">
          Certification progress
        </p>
        {STEPS.map((step) => (
          <StepIndicator
            key={step.id}
            step={step}
            currentStep={currentStep}
            isComplete={false}
          />
        ))}
      </aside>

      {/* Active step card */}
      <Card className="border border-slate-200 bg-white shadow-sm ring-0">
        {currentStep === 1 && (
          <VinVerificationStep vin={vin} onVinChange={setVin} />
        )}
        {currentStep === 2 && (
          <InspectionStep
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            location={location}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onLocationChange={setLocation}
          />
        )}
        {currentStep === 3 && <EscrowStep />}

        <CardFooter className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50 sm:w-auto"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto">
              Complete Onboarding
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
            >
              Continue
              <ChevronRight className="size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
