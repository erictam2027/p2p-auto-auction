"use client";

import { updateProfile } from "@/app/profile/actions";
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
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const profileSettingsSchema = z.object({
  dealershipName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(120, "Display name must be 120 characters or fewer."),
});

type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;

type ProfileSettingsFormProps = {
  email: string;
  dealershipName: string;
  dealerLicense: string;
};

const inputClassName =
  "h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";

const readOnlyInputClassName =
  "h-11 border-slate-200 bg-slate-50 text-slate-600";

export function ProfileSettingsForm({
  email,
  dealershipName,
  dealerLicense,
}: ProfileSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      dealershipName: dealershipName || "",
    },
  });

  async function onSubmit(values: ProfileSettingsValues) {
    setIsSubmitting(true);

    const result = await updateProfile(values.dealershipName);

    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Profile updated successfully");
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 pb-6">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Account Settings
        </CardTitle>
        <CardDescription className="text-slate-600">
          Update your display name. Email and dealer license are tied to your
          verified identity and cannot be changed here.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 pt-6">
            <FormField
              control={form.control}
              name="dealershipName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealership / Display Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Pacific Coast Motors LLC"
                      className={inputClassName}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown on your public profile and dealer listings.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                value={email}
                disabled
                readOnly
                className={readOnlyInputClassName}
              />
              <p className="text-xs text-slate-600">
                Your verified login email. Contact support to change it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-dealer-license">Dealer License Number</Label>
              <Input
                id="profile-dealer-license"
                value={dealerLicense || "Not on file"}
                disabled
                readOnly
                className={readOnlyInputClassName}
              />
              <p className="text-xs text-slate-600">
                Issued by your state motor vehicle agency. Updated during dealer
                verification.
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
