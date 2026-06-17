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
  ClipboardCheck,
  Clock,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useState } from "react";

const STEPS = [
  { id: 1, label: "VIN Check" },
  { id: 2, label: "Legit Check" },
  { id: 3, label: "Escrow" },
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

function TopProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Onboarding progress" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isComplete = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isComplete
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isActive
                        ? "border-slate-900 bg-white text-slate-900"
                        : "border-slate-200 bg-white text-slate-400",
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium sm:text-sm",
                    isActive || isComplete ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  Step {step.id}: {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-3 mb-6 h-0.5 flex-1 sm:mx-4",
                    isComplete ? "bg-slate-900" : "bg-slate-200",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function VinCheckStep({
  vin,
  onVinChange,
  onVerify,
}: {
  vin: string;
  onVinChange: (value: string) => void;
  onVerify: () => void;
}) {
  const isValid = vin.length === 17;

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Enter your Vehicle Identification Number
        </h2>
        <p className="text-sm text-slate-600">
          We&apos;ll verify your vehicle against federal title records before proceeding.
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-3 text-left">
        <label htmlFor="vin" className="sr-only">
          Vehicle Identification Number
        </label>
        <Input
          id="vin"
          value={vin}
          onChange={(e) => onVinChange(e.target.value.toUpperCase())}
          placeholder="1HGBH41JXMN109186"
          maxLength={17}
          className="h-16 border-slate-300 bg-white px-5 text-center font-mono text-xl tracking-[0.2em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-400"
        />
        <p className="text-center text-xs text-slate-600">
          {vin.length} of 17 characters
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-md border border-slate-200 bg-slate-50 px-6 py-5 text-left">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-slate-600" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Mandatory Federal NMVTIS Background Check
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              All vehicles listed on ApexAuction undergo a mandatory NMVTIS
              (National Motor Vehicle Title Information System) background check.
              This federal database review verifies title history, odometer
              readings, and screens for severe brands — including salvage, flood,
              and total-loss designations — to maintain marketplace integrity.
              Vehicles that do not pass are permanently ineligible to list.
            </p>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        disabled={!isValid}
        onClick={onVerify}
        className="h-12 min-w-[200px] bg-slate-900 px-8 text-base text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Verify VIN
      </Button>
    </div>
  );
}

function LegitCheckStep({
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
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Schedule your Legit Check</h2>
        <p className="mt-1 text-sm text-slate-600">
          A certified mobile mechanic will inspect, photograph, and certify your vehicle.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">The StockX Model for Cars</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Our Lemon Squad partner network performs a 78-point mobile inspection at your
          location, captures professional listing photography, and generates a Buyer
          Guarantee report — maximizing your final auction price.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            { icon: Wrench, text: "78-point mechanical inspection" },
            { icon: Camera, text: "Professional listing photography" },
            { icon: ClipboardCheck, text: "Buyer Guarantee report" },
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
          <p className="text-sm font-medium text-slate-900">Inspection date</p>
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
          <p className="text-sm font-medium text-slate-900">Time window</p>
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
      </div>
    </div>
  );
}

function EscrowStep() {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Secure Escrow Onboarding</h2>
        <p className="mt-1 text-sm text-slate-600">
          Complete identity verification and connect your KeySavvy payout account.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <span className="text-sm font-bold text-slate-900">KS</span>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">KeySavvy</p>
            <p className="text-sm text-slate-600">Licensed dealer escrow partner</p>
          </div>
          <Badge variant="outline" className="ml-auto border-slate-200 text-slate-700">
            Official Partner
          </Badge>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          Before your auction goes live, your identity must be verified and funds secured
          in a licensed dealer escrow account. KeySavvy holds buyer funds until title
          transfer is complete, protecting all parties on every transaction.
        </p>
      </div>

      <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
        {[
          { title: "Government ID & selfie verification", detail: "Via Persona" },
          { title: "KeySavvy seller account setup", detail: "Licensed dealer escrow profile" },
          { title: "Payout method linking", detail: "Bank account verification" },
          { title: "Title document upload", detail: "Current title or lien authorization" },
        ].map((item) => (
          <li key={item.title} className="flex items-start gap-3 px-4 py-3">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-600">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SellerOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [vin, setVin] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [location, setLocation] = useState("");

  const canProceedStep2 =
    selectedDate !== null && selectedTime !== null && location.trim().length > 0;

  function handleVerifyVin() {
    if (vin.length === 17) {
      setCurrentStep(2);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleContinue() {
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <TopProgressBar currentStep={currentStep} />

      <Card className="mt-10 border border-slate-200 bg-white shadow-sm ring-0">
        {currentStep === 1 && (
          <CardContent className="px-6 py-10 sm:px-10 sm:py-12">
            <VinCheckStep
              vin={vin}
              onVinChange={setVin}
              onVerify={handleVerifyVin}
            />
          </CardContent>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader className="border-b border-slate-200 px-6 py-6 sm:px-10">
              <CardTitle className="sr-only">Legit Check Inspection</CardTitle>
              <CardDescription className="sr-only">
                Schedule your certified mobile inspection
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-8 sm:px-10">
              <LegitCheckStep
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                location={location}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
                onLocationChange={setLocation}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-10">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!canProceedStep2}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Continue
              </Button>
            </CardFooter>
          </>
        )}

        {currentStep === 3 && (
          <>
            <CardContent className="px-6 py-8 sm:px-10">
              <EscrowStep />
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-10">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button className="bg-slate-900 text-white hover:bg-slate-800">
                Complete Onboarding
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
