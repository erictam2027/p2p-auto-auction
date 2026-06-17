"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Building2,
  Check,
  ChevronLeft,
  FileUp,
  Upload,
  User,
} from "lucide-react";
import { useRef, useState } from "react";

const STEPS = [
  { id: 1, label: "Business Details" },
  { id: 2, label: "License & Documentation" },
] as const;

type FormData = {
  dealershipName: string;
  principalName: string;
  licenseNumber: string;
  resaleCertificate: File | null;
};

const INITIAL_FORM: FormData = {
  dealershipName: "",
  principalName: "",
  licenseNumber: "",
  resaleCertificate: null,
};

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Application progress" className="mb-8">
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
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-sm font-semibold",
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
                    "hidden text-sm font-medium sm:inline",
                    isActive || isComplete ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-4 h-px flex-1",
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

function FormField({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

const inputClassName =
  "h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";

export function DealerApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canProceedStep1 =
    form.dealershipName.trim().length > 0 &&
    form.principalName.trim().length > 0;

  const canSubmit =
    form.licenseNumber.trim().length > 0 && form.resaleCertificate !== null;

  function handleContinue() {
    if (currentStep === 1 && canProceedStep1) {
      setCurrentStep(2);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleSubmit() {
    if (canSubmit) {
      setSubmitted(true);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    updateField("resaleCertificate", file);
  }

  if (submitted) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm ring-0">
        <CardContent className="px-6 py-12 text-center sm:px-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
            <Check className="size-6 text-slate-900" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Application Received
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Our dealer partnerships team will review your credentials and contact
            you within 2 business days to complete onboarding.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm ring-0">
      <CardContent className="px-6 py-8 sm:px-10">
        <StepProgress currentStep={currentStep} />

        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Business Information
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Tell us about your licensed dealership.
              </p>
            </div>

            <FormField
              id="dealership-name"
              label="Dealership Name"
              hint="Legal business name as registered with your state motor vehicle agency."
            >
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="dealership-name"
                  value={form.dealershipName}
                  onChange={(e) => updateField("dealershipName", e.target.value)}
                  placeholder="e.g. Pacific Coast Motors LLC"
                  className={cn(inputClassName, "pl-10")}
                />
              </div>
            </FormField>

            <FormField
              id="principal-name"
              label="Dealer Principal Name"
              hint="Owner or authorized officer listed on the dealer license."
            >
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="principal-name"
                  value={form.principalName}
                  onChange={(e) => updateField("principalName", e.target.value)}
                  placeholder="e.g. James Richardson"
                  className={cn(inputClassName, "pl-10")}
                />
              </div>
            </FormField>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Licensing & Documentation
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Provide your state license details and resale certificate for verification.
              </p>
            </div>

            <FormField
              id="license-number"
              label="State Dealer License Number"
              hint="As issued by your state's department of motor vehicles or licensing authority."
            >
              <div className="relative">
                <FileUp className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="license-number"
                  value={form.licenseNumber}
                  onChange={(e) => updateField("licenseNumber", e.target.value)}
                  placeholder="e.g. DL-482910"
                  className={cn(inputClassName, "pl-10 font-mono uppercase")}
                />
              </div>
            </FormField>

            <FormField
              id="resale-certificate"
              label="Resale Certificate"
              hint="PDF or image file. Required for tax-exempt dealer inventory syndication."
            >
              <input
                ref={fileInputRef}
                id="resale-certificate"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex w-full flex-col items-center justify-center rounded-md border border-dashed px-6 py-8 transition-colors",
                  form.resaleCertificate
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50",
                )}
              >
                <Upload className="size-8 text-slate-400" />
                {form.resaleCertificate ? (
                  <>
                    <p className="mt-3 text-sm font-medium text-slate-900">
                      {form.resaleCertificate.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Click to replace file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-medium text-slate-900">
                      Upload Resale Certificate
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      PDF, PNG, or JPG — max 10 MB
                    </p>
                  </>
                )}
              </button>
            </FormField>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-10">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {currentStep === 1 ? (
          <Button
            onClick={handleContinue}
            disabled={!canProceedStep1}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Submit Application
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
