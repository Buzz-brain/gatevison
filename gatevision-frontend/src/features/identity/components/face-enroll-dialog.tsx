import { useEffect, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useEnrollFace } from "@/features/recognition/hooks/use-face-api";
import type { DriverProfile } from "../types";

interface FaceEnrollDialogProps {
  open: boolean;
  onClose: () => void;
  drivers: DriverProfile[];
}

function FaceEnrollDialog({ open, onClose, drivers }: FaceEnrollDialogProps) {
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const enroll = useEnrollFace();

  useEffect(() => {
    if (open && !driverId && drivers.length > 0) setDriverId(drivers[0]!.id);
  }, [open, driverId, drivers]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selected = drivers.find((d) => d.id === driverId);

  const handleFile = (file: File | undefined) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    if (file) {
      enroll.reset();
    }
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const input = document.getElementById("face-photo") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      await enroll.mutateAsync({
        driverId: selected.id,
        fullName: selected.name,
        file,
        email: selected.email || undefined,
        department: selected.department || undefined,
      });
      onClose();
      setPreviewUrl(null);
    } catch {
      // error toast handled by the mutation
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Enroll Face"
      description="Capture a clear photo of the driver's face to register their biometric embedding for live gate matching."
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="face-driver">Driver</Label>
          <Select
            id="face-driver"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            options={drivers.map((d) => ({
              value: d.id,
              label: `${d.name} (${d.employeeId})`,
            }))}
            placeholder="Select driver"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="face-photo">Photo</Label>
          <label
            htmlFor="face-photo"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors",
              previewUrl ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-surface",
            )}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Face preview"
                className="max-h-48 rounded-md object-contain"
              />
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Click to upload a clear, front-facing photo
                </p>
              </>
            )}
          </label>
          <Input
            id="face-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!selected || !previewUrl || enroll.isPending}
            onClick={handleSubmit}
          >
            {enroll.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {enroll.isPending ? "Enrolling..." : "Enroll Face"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export { FaceEnrollDialog };
