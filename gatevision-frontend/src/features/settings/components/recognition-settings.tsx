import { motion } from "framer-motion";
import {
  Scan, Eye, Fingerprint, FileCheck, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSettings } from "../hooks/use-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { VERIFICATION_OPTIONS } from "../utils";

interface SliderFieldProps {
  label: string;
  tooltip: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayFn?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderField({
  label,
  tooltip,
  value,
  min,
  max,
  step,
  displayFn,
  onChange,
}: SliderFieldProps) {
  const display = displayFn
    ? displayFn(value)
    : `${(value * 100).toFixed(0)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">{label}</Label>
          <Tooltip content={tooltip} side="top">
            <Info className="h-3 w-3 text-muted-foreground/40" />
          </Tooltip>
        </div>
        <span className="text-xs font-mono text-primary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-border accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function RecognitionSettings() {
  const prefersReduced = useReducedMotion();
  const { recognition, updateRecognition } = useSettings();

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <Scan className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Recognition Settings</h2>
          <p className="text-sm text-muted-foreground">
            Fine-tune plate detection, OCR, face recognition, and vehicle fingerprinting
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plate Detection */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10">
                  <Scan className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Plate Detection</CardTitle>
                  <CardDescription>YOLO-based license plate detection parameters</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderField
                label="Confidence Threshold"
                tooltip="Minimum confidence for plate detection. Higher values reduce false positives but may miss plates."
                value={recognition.plateDetection.confidence}
                min={0.1}
                max={0.99}
                step={0.01}
                onChange={(v) =>
                  updateRecognition({
                    plateDetection: { ...recognition.plateDetection, confidence: v },
                  })
                }
              />
              <SliderField
                label="Image Size"
                tooltip="Input resolution for detection. Larger sizes improve accuracy but slow down inference."
                value={recognition.plateDetection.imageSize}
                min={320}
                max={1280}
                step={32}
                displayFn={(v) => `${v}px`}
                onChange={(v) =>
                  updateRecognition({
                    plateDetection: { ...recognition.plateDetection, imageSize: v },
                  })
                }
              />
              <SliderField
                label="NMS Threshold"
                tooltip="Non-maximum suppression threshold. Controls overlap tolerance for duplicate plate detections."
                value={recognition.plateDetection.nmsThreshold}
                min={0.1}
                max={0.9}
                step={0.01}
                onChange={(v) =>
                  updateRecognition({
                    plateDetection: { ...recognition.plateDetection, nmsThreshold: v },
                  })
                }
              />
              <SliderField
                label="Max Plates Per Frame"
                tooltip="Maximum number of plates to detect in a single frame."
                value={recognition.plateDetection.maxPlates}
                min={1}
                max={10}
                step={1}
                displayFn={(v) => String(v)}
                onChange={(v) =>
                  updateRecognition({
                    plateDetection: { ...recognition.plateDetection, maxPlates: v },
                  })
                }
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* OCR */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10">
                  <FileCheck className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">OCR</CardTitle>
                  <CardDescription>Optical character recognition for plate text extraction</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderField
                label="Minimum Confidence"
                tooltip="Minimum OCR confidence to accept a character reading. Higher values improve accuracy."
                value={recognition.ocr.minConfidence}
                min={0.1}
                max={0.99}
                step={0.01}
                onChange={(v) =>
                  updateRecognition({
                    ocr: { ...recognition.ocr, minConfidence: v },
                  })
                }
              />
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Preprocessing</Label>
                    <p className="text-[10px] text-muted-foreground/60">
                      Apply image preprocessing (contrast, sharpening) before OCR
                    </p>
                  </div>
                </div>
                <Switch
                  checked={recognition.ocr.preprocessing}
                  onCheckedChange={(val) =>
                    updateRecognition({
                      ocr: { ...recognition.ocr, preprocessing: val },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Character Validation</Label>
                    <p className="text-[10px] text-muted-foreground/60">
                      Validate OCR output against known license plate patterns
                    </p>
                  </div>
                </div>
                <Switch
                  checked={recognition.ocr.characterValidation}
                  onCheckedChange={(val) =>
                    updateRecognition({
                      ocr: { ...recognition.ocr, characterValidation: val },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Face Recognition */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-400/10">
                  <Eye className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Face Recognition</CardTitle>
                  <CardDescription>InsightFace-based face matching and verification</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderField
                label="Similarity Threshold"
                tooltip="Minimum cosine similarity to consider a face match. Higher values are stricter."
                value={recognition.faceRecognition.similarityThreshold}
                min={0.1}
                max={0.99}
                step={0.01}
                onChange={(v) =>
                  updateRecognition({
                    faceRecognition: { ...recognition.faceRecognition, similarityThreshold: v },
                  })
                }
              />
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">Face Alignment</Label>
                  <p className="text-[10px] text-muted-foreground/60">
                    Align detected faces to a canonical pose before comparison
                  </p>
                </div>
                <Switch
                  checked={recognition.faceRecognition.alignment}
                  onCheckedChange={(val) =>
                    updateRecognition({
                      faceRecognition: { ...recognition.faceRecognition, alignment: val },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">Allow Multiple Faces</Label>
                  <p className="text-[10px] text-muted-foreground/60">
                    Detect and process multiple faces per frame (increases CPU usage)
                  </p>
                </div>
                <Switch
                  checked={recognition.faceRecognition.multipleFaces}
                  onCheckedChange={(val) =>
                    updateRecognition({
                      faceRecognition: { ...recognition.faceRecognition, multipleFaces: val },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Fingerprint */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-400/10">
                  <Fingerprint className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Vehicle Fingerprint</CardTitle>
                  <CardDescription>ResNet50-based vehicle appearance matching</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderField
                label="Similarity Threshold"
                tooltip="Minimum similarity for vehicle fingerprint match. Higher values reduce false matches."
                value={recognition.vehicleFingerprint.similarityThreshold}
                min={0.1}
                max={0.99}
                step={0.01}
                onChange={(v) =>
                  updateRecognition({
                    vehicleFingerprint: { ...recognition.vehicleFingerprint, similarityThreshold: v },
                  })
                }
              />
              <SliderField
                label="Embedding Size"
                tooltip="Dimensionality of the fingerprint vector. Larger vectors capture more detail but use more memory."
                value={recognition.vehicleFingerprint.embeddingSize}
                min={64}
                max={2048}
                step={64}
                displayFn={(v) => String(v)}
                onChange={(v) =>
                  updateRecognition({
                    vehicleFingerprint: { ...recognition.vehicleFingerprint, embeddingSize: v },
                  })
                }
              />
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">Verification Mode</Label>
                  <Tooltip
                    content="Strict: reject on any ambiguity. Balanced: compromise between false accept/reject. Relaxed: favor convenience."
                    side="top"
                  >
                    <Info className="h-3 w-3 text-muted-foreground/40" />
                  </Tooltip>
                </div>
                <Select
                  value={recognition.vehicleFingerprint.verificationMode}
                  onChange={(e) =>
                    updateRecognition({
                      vehicleFingerprint: {
                        ...recognition.vehicleFingerprint,
                        verificationMode: e.target.value as "strict" | "balanced" | "relaxed",
                      },
                    })
                  }
                  options={VERIFICATION_OPTIONS}
                />
                <Badge
                  variant={
                    recognition.vehicleFingerprint.verificationMode === "strict"
                      ? "warning"
                      : recognition.vehicleFingerprint.verificationMode === "balanced"
                        ? "default"
                        : "info"
                  }
                  size="sm"
                >
                  {recognition.vehicleFingerprint.verificationMode}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { RecognitionSettings };
