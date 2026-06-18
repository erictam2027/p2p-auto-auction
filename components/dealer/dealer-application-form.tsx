"use client";

import { submitDealerApplication } from "@/app/dealer-application/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, FileText, Loader2, Phone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const dealerApplicationSchema = z.object({
  dealershipName: z
    .string()
    .trim()
    .min(1, "Dealership name is required.")
    .max(120, "Dealership name must be 120 characters or fewer."),
  dealerLicense: z
    .string()
    .trim()
    .min(1, "Dealer license number is required.")
    .max(64, "License number must be 64 characters or fewer."),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number.")
    .max(20, "Phone number must be 20 characters or fewer.")
    .regex(/^[\d\s()+.-]+$/, "Enter a valid phone number."),
});

type DealerApplicationValues = z.infer<typeof dealerApplicationSchema>;

type DealerApplicationFormProps = {
  defaultValues?: {
    dealershipName?: string | null;
    dealerLicense?: string | null;
    phone?: string | null;
  };
};

const inputClassName =
  "h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";

export function DealerApplicationForm({ defaultValues }: DealerApplicationFormProps) {
  const router = useRouter();

  const form = useForm<DealerApplicationValues>({
    resolver: zodResolver(dealerApplicationSchema),
    defaultValues: {
      dealershipName: defaultValues?.dealershipName ?? "",
      dealerLicense: defaultValues?.dealerLicense ?? "",
      phone: defaultValues?.phone ?? "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: DealerApplicationValues) {
    const result = await submitDealerApplication({
      dealershipName: values.dealershipName,
      dealerLicense: values.dealerLicense,
      phone: values.phone,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Application submitted successfully! Our team will review it shortly.");
    router.push("/");
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <ShieldCheck className="size-5 text-slate-700" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Dealer Verification
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              Submit your dealership credentials for trust & safety review.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 pt-6">
            <FormField
              control={form.control}
              name="dealershipName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealership Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...field}
                        placeholder="e.g. Pacific Coast Motors LLC"
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dealerLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealer License Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...field}
                        placeholder="e.g. DL-482910"
                        className={`${inputClassName} pl-10 font-mono`}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Use the license number issued by your state motor vehicle agency.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...field}
                        type="tel"
                        placeholder="e.g. (555) 123-4567"
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    A direct line for trust & safety verification callbacks.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
