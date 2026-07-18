"use client";

import { uploadVehicle } from "@/app/dashboard/upload/actions";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const vehicleUploadSchema = z.object({
  year: z
    .string()
    .trim()
    .min(4, "Year is required.")
    .refine((value) => {
      const parsed = Number.parseInt(value, 10);
      return (
        Number.isFinite(parsed) &&
        parsed >= 1900 &&
        parsed <= new Date().getFullYear() + 1
      );
    }, "Enter a valid year."),
  make: z.string().trim().min(1, "Make is required."),
  model: z.string().trim().min(1, "Model is required."),
  vin: z
    .string()
    .trim()
    .min(11, "VIN must be at least 11 characters.")
    .max(17, "VIN must be 17 characters or fewer."),
  mileage: z
    .string()
    .trim()
    .min(1, "Mileage is required.")
    .refine((value) => {
      const parsed = Number.parseInt(value.replace(/[$,\s]/g, ""), 10);
      return Number.isFinite(parsed) && parsed >= 0;
    }, "Enter a valid mileage."),
  engine: z.string().trim().min(1, "Engine is required."),
  transmission: z
    .string()
    .trim()
    .refine((value) => value === "Automatic" || value === "Manual", {
      message: "Select Automatic or Manual.",
    }),
  drivetrain: z.string().trim().min(1, "Drivetrain is required."),
  exteriorColor: z.string().trim().min(1, "Exterior color is required."),
  interiorColor: z.string().trim().min(1, "Interior color is required."),
  titleStatus: z.string().trim().min(1, "Title status is required."),
  location: z.string().trim().optional(),
  reservePrice: z.string().trim().optional(),
  highlights: z.string().trim().min(1, "Add at least one highlight."),
  knownFlaws: z.string().optional(),
});

type VehicleUploadValues = z.input<typeof vehicleUploadSchema>;
type SelectedImage = { file: File; previewUrl: string };

const MAX_VEHICLE_IMAGES = 12;
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

const inputClassName =
  "h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";

const textareaClassName =
  "min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400";

export function VehicleUploadForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<SelectedImage[]>([]);
  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const imageFilesRef = useRef<SelectedImage[]>([]);

  const form = useForm<VehicleUploadValues>({
    resolver: zodResolver(vehicleUploadSchema),
    defaultValues: {
      year: String(new Date().getFullYear()),
      make: "",
      model: "",
      vin: "",
      mileage: "0",
      engine: "",
      transmission: "",
      drivetrain: "",
      exteriorColor: "",
      interiorColor: "",
      titleStatus: "Clean title",
      location: "",
      reservePrice: "",
      highlights: "",
      knownFlaws: "",
    },
  });

  useEffect(() => {
    imageFilesRef.current = imageFiles;
  }, [imageFiles]);

  useEffect(() => {
    return () => {
      imageFilesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  function addImages(files: File[]) {
    const remaining = MAX_VEHICLE_IMAGES - imageFiles.length;

    if (files.length > remaining) {
      toast.error(`You can add up to ${MAX_VEHICLE_IMAGES} vehicle photos.`);
    }

    const nextFiles = files.slice(0, Math.max(remaining, 0));
    const invalidFile = nextFiles.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_IMAGE_FILE_SIZE,
    );

    if (invalidFile) {
      toast.error("Each photo must be an image smaller than 10 MB.");
      return;
    }

    setImageFiles((current) => [
      ...current,
      ...nextFiles.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  }

  function removeImage(index: number) {
    setImageFiles((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  }

  async function uploadImages(files: SelectedImage[], vin: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Your session expired. Sign in again before publishing.");
    }

    const batchId = crypto.randomUUID();
    const vinPrefix = vin.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const uploadedPaths: string[] = [];

    try {
      const urls: string[] = [];

      for (const [index, { file }] of files.entries()) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${vinPrefix}-${batchId}-${index + 1}.${extension}`;
        const { error } = await supabase.storage.from("vehicle-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

        if (error) throw new Error(error.message);
        uploadedPaths.push(path);
        urls.push(supabase.storage.from("vehicle-images").getPublicUrl(path).data.publicUrl);
      }

      return { urls, uploadedPaths };
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("vehicle-images").remove(uploadedPaths);
      }
      throw error;
    }
  }

  async function onSubmit(values: VehicleUploadValues) {
    if (imageFiles.length === 0) {
      toast.error("Add at least one vehicle photo before publishing.");
      return;
    }

    const formData = new FormData();
    formData.append("year", values.year);
    formData.append("make", values.make);
    formData.append("model", values.model);
    formData.append("vin", values.vin);
    formData.append("mileage", values.mileage);
    formData.append("engine", values.engine);
    formData.append("transmission", values.transmission);
    formData.append("drivetrain", values.drivetrain);
    formData.append("exteriorColor", values.exteriorColor);
    formData.append("interiorColor", values.interiorColor);
    formData.append("titleStatus", values.titleStatus);
    formData.append("location", values.location ?? "");
    formData.append("reservePrice", values.reservePrice ?? "");
    formData.append("highlights", values.highlights);
    formData.append("knownFlaws", values.knownFlaws ?? "");

    setIsSubmitting(true);

    let uploadedPaths: string[] = [];

    try {
      const uploaded = await uploadImages(imageFiles, values.vin);
      uploadedPaths = uploaded.uploadedPaths;
      formData.append("imageUrls", JSON.stringify(uploaded.urls));
      if (historyFile) {
        formData.append("carfax", historyFile);
      }

      const result = await uploadVehicle(formData);

      if (!result.ok) {
        await createClient().storage.from("vehicle-images").remove(uploadedPaths);
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Vehicle published successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await createClient().storage.from("vehicle-images").remove(uploadedPaths);
      }
      toast.error(error instanceof Error ? error.message : "Unable to upload vehicle photos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-xl font-semibold text-slate-900">
          Vehicle Details
        </CardTitle>
        <CardDescription className="text-slate-600">
          Add a verified listing to your dealer inventory catalog.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Core Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>VIN</FormLabel>
                      <FormControl>
                        <Input className={`${inputClassName} font-mono uppercase`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Mechanical &amp; Colors</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="engine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engine</FormLabel>
                      <FormControl>
                        <Input className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmission</FormLabel>
                      <FormControl>
                        <Select
                          className={inputClassName}
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <option value="" disabled>
                            Select transmission
                          </option>
                          <option value="Automatic">Automatic</option>
                          <option value="Manual">Manual</option>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="drivetrain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drivetrain</FormLabel>
                      <FormControl>
                        <Input className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="titleStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Status</FormLabel>
                      <FormControl>
                        <Input className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City, ST"
                          className={inputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reservePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserve price (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0 = no reserve"
                          className={inputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exteriorColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exterior Color</FormLabel>
                      <FormControl>
                        <Input className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interiorColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interior Color</FormLabel>
                      <FormControl>
                        <Input className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Listing Copy</h3>
              <FormField
                control={form.control}
                name="highlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highlights</FormLabel>
                    <FormControl>
                      <textarea
                        className={textareaClassName}
                        placeholder="One highlight per line"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="knownFlaws"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Known Flaws</FormLabel>
                    <FormControl>
                      <textarea
                        className={textareaClassName}
                        placeholder="One flaw per line (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-900">Listing Photos</h3>
                <span className="text-xs text-slate-500">
                  {imageFiles.length}/{MAX_VEHICLE_IMAGES}
                </span>
              </div>
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="border-slate-300 bg-white file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                  onChange={(event) => {
                    addImages(Array.from(event.target.files ?? []));
                    event.currentTarget.value = "";
                  }}
                />
                <p className="mt-2 text-xs text-slate-600">
                  The first photo is the cover image. Add exterior, interior, condition, and document photos.
                </p>
                {imageFiles.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {imageFiles.map(({ file, previewUrl }, index) => (
                      <div key={previewUrl} className="group relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-white">
                        {/* Browser previews use a local blob URL before the image is uploaded. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt={`Selected photo ${index + 1}: ${file.name}`}
                          className="h-full w-full object-cover"
                        />
                        {index === 0 ? (
                          <span className="absolute bottom-1 left-1 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            Cover
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-md bg-white/95 text-slate-700 shadow-sm hover:bg-white"
                          aria-label={`Remove photo ${index + 1}`}
                          title={`Remove photo ${index + 1}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <ImagePlus className="size-4" />
                    Add up to 12 JPG, PNG, or WebP photos, 10 MB each.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Vehicle History Document
              </h3>
              <div className="rounded-md border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                    <FileText className="size-5 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="border-slate-300 bg-white file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                      onChange={(event) => {
                        setHistoryFile(event.target.files?.[0] ?? null);
                      }}
                    />
                    <p className="mt-2 text-xs text-slate-600">
                      {historyFile
                        ? `Selected: ${historyFile.name}`
                        : "Optional PDF for Carfax, AutoCheck, inspection, or dealer disclosure packet."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </CardContent>

          <CardFooter className="justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Publish Vehicle
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
