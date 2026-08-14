import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, Upload, ShieldCheck, X, Volume2, VolumeX,
  CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw,
  ScanLine, LogIn, LogOut, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useUIStore } from "@/store/ui-store";
import { useForceCloseSession } from "@/features/gate-operations/hooks/use-gate-operations-api";
import { playGateSound, primeAudio, type GateSound } from "../utils/sounds";
import { useProcessPipeline } from "../hooks/use-recognition-api";
import { recognizeFaceUploadApi } from "@/services/api/face.api";
import { mapPipelineResult } from "../api/mapper";
import type { RecognitionResult } from "../types";
import type { ApiPipelineResult } from "../types/api";

type Phase = "welcome" | "scanning" | "face_scan" | "face_validating" | "complete" | "error";

interface LiveGateOverlayProps {
  onClose: () => void;
  direction: "entry" | "exit";
  requireFace: boolean;
}

const MAX_FACE_ATTEMPTS = 3;
const WELCOME_TEXT = "Welcome to UNILAG. Please stop at the gate and look at the camera.";
const GRANT_TEXT = "Access granted. You are welcome to UNILAG.";

function speak(text: string, muted: boolean) {
  if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unavailable - ignore */
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function speakLine(text: string, muted: boolean): Promise<void> {
  return new Promise((resolve) => {
    if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    try {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92;
      u.pitch = 1;
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
      const words = Math.max(1, text.split(/\s+/).length);
      setTimeout(finish, words * 480 + 1200);
    } catch {
      resolve();
    }
  });
}

interface JourneyStep {
  text: string;
  spoken?: string;
  sound?: GateSound;
  reveal?: boolean;
}

const SCAN_STEPS: JourneyStep[] = [
  { text: "Looking for your license plate...", spoken: "Looking for your license plate. Please hold still." },
  { text: "Scanning the vehicle front...", spoken: "Scanning the vehicle front." },
  { text: "Reading the plate characters...", spoken: "Reading the plate characters." },
  { text: "Checking the vehicle against our records...", spoken: "Checking the vehicle against our records." },
  { text: "Just a moment while I finish the verification...", spoken: "Just a moment while I finish the verification." },
];

const FACE_SCAN_STEPS: JourneyStep[] = [
  { text: "Verifying your identity...", spoken: "Verifying your identity. Please hold still." },
  { text: "Matching your face against the vehicle record...", spoken: "Matching your face against the vehicle record." },
  { text: "Just a moment while I finish the verification...", spoken: "Just a moment while I finish the verification." },
];

function getCameraErrorMessage(err: unknown): string {
  const name = err && typeof err === "object" && "name" in err ? String((err as { name?: unknown }).name ?? "") : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera permission was denied. Click the camera or lock icon in your browser address bar, allow camera access, then press Enable Camera. Or upload a photo of your face instead.";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "No camera was detected on this device. You can upload a photo of your face instead.";
    case "NotReadableError":
    case "TrackStartError":
      return "The camera is already in use by another app or tab. Close it, then press Enable Camera. Or upload a photo of your face instead.";
    default:
      return "Camera unavailable - you can still upload an image instead.";
  }
}

function buildFinaleSteps(
  api: ApiPipelineResult,
  mapped: RecognitionResult,
  direction: "entry" | "exit",
  requireFace: boolean,
  faceHandledInDedicatedStep: boolean,
): JourneyStep[] {
  const plate = mapped.ocr?.cleaned || mapped.ocr?.raw || "";
  const hasPlate = Boolean(plate);
  const faceDetected = api.face?.detected === true;
  const hasFingerprint = Boolean(
    api.vehicle &&
      (api.vehicle.embedding_score > 0 || api.vehicle.features.length > 0 || api.vehicle.detected_model),
  );
  const decision = api.decision?.decision ?? "manual_review";
  const gateRejected = api.gate != null && api.gate.success === false;

  let decisionText = "";
  let decisionSpoken = "";
  let decisionSound: GateSound | undefined;
  if (decision === "granted" && !gateRejected) {
    decisionText = direction === "exit"
      ? "Access granted. You may now exit the facility."
      : GRANT_TEXT;
    decisionSpoken = decisionText;
    decisionSound = "open";
  } else if (decision === "granted" && gateRejected) {
    decisionText = api.gate?.message ?? "This vehicle is already inside. Please use the exit lane.";
    decisionSpoken =
      direction === "entry"
        ? "This vehicle is already inside. Please use the exit lane."
        : "This vehicle is already outside. Please use the entry lane.";
    decisionSound = "deny";
  } else if (decision === "denied") {
    decisionText = "Access denied. Please do not proceed.";
    decisionSpoken = "Access denied. Please do not proceed.";
    decisionSound = "deny";
  } else {
    decisionText = "Manual review required. Please wait for the operator.";
    decisionSpoken = "Manual review required. Please wait for the operator.";
    decisionSound = "deny";
  }

  const steps: JourneyStep[] = [];

  if (hasPlate) {
    steps.push({
      text: `Found it! Your plate is ${plate}.`,
      spoken: `Found it, your plate is ${plate}.`,
      sound: "beep",
    });
  } else {
    steps.push({
      text: "I could not read a license plate clearly.",
      spoken: "I could not read a license plate clearly.",
    });
  }

  if (hasFingerprint) {
    steps.push(
      { text: "Now taking the vehicle fingerprint...", spoken: "Now taking the vehicle fingerprint." },
      { text: "Vehicle fingerprint captured.", spoken: "Vehicle fingerprint captured." },
    );
  }

  if (requireFace && faceHandledInDedicatedStep) {
    if (faceDetected) {
      steps.push({ text: "Face identity verified. Thank you.", spoken: "Face identity verified. Thank you." });
    } else {
      steps.push({ text: "I could not verify your face clearly.", spoken: "I could not verify your face clearly." });
    }
  }

  steps.push({ text: "One last thing... verifying the access list.", spoken: "One last thing." });
  steps.push({ text: decisionText, spoken: decisionSpoken, sound: decisionSound, reveal: true });

  return steps;
}

function LiveGateOverlay({ onClose, direction, requireFace }: LiveGateOverlayProps) {
  const prefersReduced = useReducedMotion();
  const mutation = useProcessPipeline();
  const addNotification = useUIStore((s) => s.addNotification);
  const forceClose = useForceCloseSession();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [narrative, setNarrative] = useState(WELCOME_TEXT);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [apiResult, setApiResult] = useState<ApiPipelineResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revealDecision, setRevealDecision] = useState(false);
  const [scanKind, setScanKind] = useState<"vehicle" | "face">("vehicle");
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null);
  const [faceDenied, setFaceDenied] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl);
    };
  }, [previewUrl, facePreviewUrl]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attemptsRef = useRef(0);
  const welcomeSpokenRef = useRef(false);
  const journeySeqRef = useRef(0);
  const phaseRef = useRef<Phase>("welcome");
  const mutedRef = useRef(false);
  const pendingResultRef = useRef<ApiPipelineResult | null>(null);
  const vehicleFileRef = useRef<File | null>(null);
  const cameraStartingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video && streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => undefined);
    }
  }, [phase, previewUrl, facePreviewUrl]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    if (!welcomeSpokenRef.current) {
      welcomeSpokenRef.current = true;
      speak(WELCOME_TEXT, muted);
    }
  }, [muted]);

  const startCamera = useCallback(async () => {
    if (cameraStartingRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is blocked in this browser. It only works over HTTPS or http://localhost. Open the app at http://localhost:5173 to use the camera, or upload a photo of your face instead.",
      );
      return;
    }
    if (streamRef.current && streamRef.current.active) {
      setCameraError(null);
      const video = videoRef.current;
      if (video && video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
        video.play().catch(() => undefined);
      }
      return;
    }
    cameraStartingRef.current = true;
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.play().catch(() => undefined);
      }
    } catch (err) {
      setCameraError(getCameraErrorMessage(err));
    } finally {
      cameraStartingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (phase === "face_scan" && !streamRef.current) {
      void startCamera();
    }
  }, [phase, startCamera]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      journeySeqRef.current++;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);
  const captureFrame = useCallback(async (): Promise<File | null> => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        resolve(new File([blob], `gate-capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    });
  }, []);

  const runJourneySteps = useCallback(async (steps: JourneyStep[], gapMs = 650) => {
    const seq = journeySeqRef.current;
    for (const s of steps) {
      if (journeySeqRef.current !== seq) return;
      try {
        if (s.sound && !mutedRef.current) playGateSound(s.sound);
      } catch {
        /* audio unavailable - narration continues */
      }
      if (s.reveal) setRevealDecision(true);
      setNarrative(s.text);
      await speakLine(s.spoken ?? s.text, mutedRef.current);
      if (gapMs > 0) await sleep(gapMs);
    }
  }, []);

  const handleResult = useCallback((api: ApiPipelineResult) => {
    if (phaseRef.current !== "scanning") return;
    pendingResultRef.current = api;
    const mapped = mapPipelineResult(api);
    setResult(mapped);
    setApiResult(api);
  }, []);

  const handleError = useCallback((e: unknown) => {
    if (phaseRef.current !== "scanning") return;
    journeySeqRef.current++;
    setPhase("error");
    const msg =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message ?? "")
          : "";
    setErrorMessage(msg || "Capture could not be processed.");
    setNarrative("Sorry, I could not process that capture. Please try again.");
    speak("Sorry, I could not process that capture. Please try again.", mutedRef.current);
  }, []);

  const runScan = useCallback(async (file: File, kind: "vehicle" | "face") => {
    const seq = ++journeySeqRef.current;
    setScanKind(kind);
    if (kind === "vehicle") {
      setResult(null);
      setApiResult(null);
    }
    pendingResultRef.current = null;
    setRevealDecision(false);
    setPhase("scanning");

    const combinedFile = kind === "face" ? (vehicleFileRef.current ?? file) : file;
    const promise = mutation.mutateAsync({
      file: combinedFile,
      faceFile: kind === "face" ? file : undefined,
      direction,
      requireFace: kind === "face" ? requireFace : false,
    });
    promise.then(handleResult).catch(handleError);

    try {
      await runJourneySteps(kind === "face" ? FACE_SCAN_STEPS : SCAN_STEPS);
      if (journeySeqRef.current !== seq) return;

      const api = pendingResultRef.current ?? (await promise.catch(() => null));
      if (!api || journeySeqRef.current !== seq) return;
      if (phaseRef.current !== "scanning") return;

      if (kind === "vehicle" && requireFace) {
        const decision = api.decision?.decision ?? "manual_review";
        const gateRejected = api.gate != null && api.gate.success === false;
        if (decision === "granted" && !gateRejected) {
          vehicleFileRef.current = file;
          const plate = api.ocr?.cleaned_text || api.ocr?.raw_text || "";
          setPhase("face_scan");
          setFacePreviewUrl(null);
          setFaceDenied(false);
          const msg = plate
            ? `Vehicle identified as ${plate}. Now please look at the face camera so I can verify you.`
            : "Vehicle scanned. Now please look at the face camera so I can verify you.";
          setNarrative(msg);
          speak(msg, mutedRef.current);
        } else {
          setPhase("complete");
          const mapped = mapPipelineResult(api);
          await runJourneySteps(buildFinaleSteps(api, mapped, direction, requireFace, false), 700);
        }
        return;
      }

      setPhase("complete");
      const mapped = mapPipelineResult(api);
      await runJourneySteps(buildFinaleSteps(api, mapped, direction, requireFace, kind === "face"), 700);
    } catch (err) {
      console.error("Live gate scan aborted:", err);
      handleError(err ?? null);
    }
  }, [mutation, direction, requireFace, handleResult, handleError, runJourneySteps]);

  const handleCapture = useCallback(async () => {
    primeAudio();
    const file = await captureFrame();
    if (file) await runScan(file, "vehicle");
  }, [captureFrame, runScan]);

  const handleUpload = useCallback(async (file: File) => {
    primeAudio();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    await runScan(file, "vehicle");
  }, [runScan, previewUrl]);

  const finishFaceDenied = useCallback(() => {
    journeySeqRef.current++;
    setPhase("complete");
    setRevealDecision(true);
    setFaceDenied(true);
    setFacePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    const plate = result?.ocr?.cleaned || result?.ocr?.raw || "";
    setNarrative("Access denied. We could not verify your identity at the gate. Please see the operator.");
    speak("Access denied. We could not verify your identity at the gate. Please see the operator.", mutedRef.current);
  }, [result]);

  const validateFace = useCallback(async (faceFile: File) => {
    const seq = ++journeySeqRef.current;
    setPhase("face_validating");
    setNarrative("Checking your face photo...");

    const fail = (message: string, spoken: string) => {
      if (journeySeqRef.current !== seq) return;
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      if (attemptsRef.current >= MAX_FACE_ATTEMPTS) {
        finishFaceDenied();
        return;
      }
      setPhase("face_scan");
      setFacePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setNarrative(`${message} (Attempt ${attemptsRef.current} of ${MAX_FACE_ATTEMPTS})`);
      speak(spoken, mutedRef.current);
    };

    try {
      const res = await recognizeFaceUploadApi(faceFile);
      if (journeySeqRef.current !== seq) return;
      if (res.face_detected) {
        setNarrative("Face captured. Thank you. Now completing the verification...");
        speak("Face captured. Thank you.", mutedRef.current);
        await runScan(faceFile, "face");
      } else {
        fail(
          "No face detected in that photo. Please position your face in the oval and look directly at the camera.",
          "No face detected in that photo. Please position your face in the oval and look directly at the camera.",
        );
      }
    } catch (e) {
      if (journeySeqRef.current !== seq) return;
      const msg = e instanceof Error ? e.message : "";
      fail(
        `I could not check that face photo${msg ? ` (${msg})` : ""}. Please try again.`,
        "I could not check that face photo. Please try again.",
      );
    }
  }, [runScan, finishFaceDenied]);

  const handleFaceCapture = useCallback(async () => {
    primeAudio();
    const file = await captureFrame();
    if (file) {
      setFacePreviewUrl(URL.createObjectURL(file));
      await validateFace(file);
    }
  }, [captureFrame, validateFace]);

  const handleFaceUpload = useCallback(async (file: File) => {
    primeAudio();
    setFacePreviewUrl(URL.createObjectURL(file));
    await validateFace(file);
  }, [validateFace]);

  const handleClearSession = useCallback(async () => {
    const plate = result?.ocr.cleaned || result?.ocr.raw;
    if (!plate) return;
    try {
      await forceClose.mutateAsync(plate);
      addNotification({
        type: "success",
        category: "recognition",
        title: "Session cleared",
        description: `Vehicle ${plate} was force-closed and marked as exited.`,
      });
      setNarrative(`Session for ${plate} cleared. You can scan the next vehicle.`);
    } catch (e) {
      addNotification({
        type: "error",
        category: "recognition",
        title: "Could not clear session",
        description: e instanceof Error ? e.message : "Could not clear the stuck session.",
      });
    }
  }, [result, forceClose, addNotification]);

  const resetKiosk = useCallback(() => {
    attemptsRef.current = 0;
    setAttempts(0);
    setResult(null);
    setApiResult(null);
    setErrorMessage(null);
    journeySeqRef.current++;
    pendingResultRef.current = null;
    setRevealDecision(false);
    vehicleFileRef.current = null;
    setFaceDenied(false);
    setScanKind("vehicle");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl);
    setFacePreviewUrl(null);
    setPhase("welcome");
    setNarrative(WELCOME_TEXT);
    speak("Ready. Please scan the next vehicle.", mutedRef.current);
  }, [previewUrl, facePreviewUrl]);

  const outcomeColor =
    phase === "complete" && faceDenied
      ? "danger"
      : phase === "complete" && apiResult?.decision?.decision === "granted" && apiResult.gate?.success !== false
        ? "success"
        : phase === "complete" && (apiResult?.decision?.decision === "denied" || apiResult?.gate?.success === false)
          ? "danger"
          : "warning";

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col overflow-hidden bg-gradient-to-br from-background via-surface to-background"
      initial={prefersReduced ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReduced ? undefined : { opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-glow-primary">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold">GateVision Live Gate</span>
          <Badge variant="info" className="text-[9px] px-1.5 py-0">Driver Facing</Badge>
          <Badge variant={direction === "entry" ? "success" : "neutral"} className="ml-1">
            {direction === "entry" ? "ENTRY" : "EXIT"}
          </Badge>
          {requireFace && <Badge variant="warning">Face required</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => { primeAudio(); setMuted((m) => !m); }} title={muted ? "Unmute voice" : "Mute voice"}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-8 p-6">
        {/* Video preview */}
        <div className="relative w-full max-w-3xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/40 bg-black/70 shadow-2xl">
            {facePreviewUrl ? (
              <img src={facePreviewUrl} alt="Uploaded face" className="h-full w-full object-cover" />
            ) : phase === "face_scan" ? (
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Uploaded vehicle" className="h-full w-full object-cover" />
            ) : (
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            )}
            {!facePreviewUrl && !streamRef.current && !cameraError && (phase === "face_scan" || !previewUrl) && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting camera...
              </div>
            )}
            {facePreviewUrl ? (
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                Face photo
              </div>
            ) : phase === "face_scan" && cameraError && !streamRef.current ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
                <span className="text-sm text-muted-foreground">{cameraError}</span>
                <Button size="sm" variant="outline" onClick={() => { void startCamera(); }} className="gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> Enable Camera
                </Button>
              </div>
            ) : phase === "face_scan" ? (
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                Face camera
              </div>
            ) : previewUrl ? (
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                Uploaded image
              </div>
            ) : cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {cameraError}
              </div>
            ) : null}
            {/* Face placement guide */}
            {phase === "face_scan" && !facePreviewUrl && !cameraError && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative flex h-[72%] w-[40%] items-center justify-center rounded-[50%] border-2 border-dashed border-white/70 bg-primary/10 shadow-[inset_0_0_50px_rgba(59,130,246,0.25)]">
                  <span className="px-4 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/90">
                    Position your face here
                  </span>
                </div>
              </div>
            )}
            {(phase === "scanning" || phase === "face_scan" || phase === "face_validating") && !prefersReduced && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
          {/* Scan corner markers */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-3 top-3 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-primary/70" />
            <div className="absolute right-3 top-3 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-primary/70" />
            <div className="absolute bottom-3 left-3 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-primary/70" />
            <div className="absolute bottom-3 right-3 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-primary/70" />
          </div>
          {/* Barrier opening */}
          {phase === "complete" && revealDecision && apiResult?.decision?.decision === "granted" && apiResult.gate?.success !== false && (
            <div className="absolute inset-x-4 bottom-3 z-10">
              <motion.div
                className="mx-auto h-2.5 w-3/4 origin-bottom-right rounded-t-md bg-gradient-to-r from-success/80 via-success to-success/80 shadow-[0_0_18px_rgba(34,197,94,0.55)]"
                initial={prefersReduced ? undefined : { rotate: -78, opacity: 0.7 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
                style={{ transformOrigin: "bottom right" }}
              >
                <div className="absolute right-0 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded bg-gradient-to-b from-success/90 to-success/70" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Narration */}
        <motion.div
          key={narrative}
          initial={prefersReduced ? undefined : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-2xl text-center"
        >
          {phase === "complete" && apiResult && revealDecision && (
            <div className={cn("mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold",
              outcomeColor === "success" && "border-success/30 bg-success/10 text-success",
              outcomeColor === "danger" && "border-danger/30 bg-danger/10 text-danger",
              outcomeColor === "warning" && "border-warning/30 bg-warning/10 text-warning")}>
              {outcomeColor === "success" && <><CheckCircle2 className="h-4 w-4" /> ACCESS GRANTED</>}
              {outcomeColor === "danger" && (faceDenied
                ? <><XCircle className="h-4 w-4" /> ACCESS DENIED</>
                : apiResult.decision?.decision === "denied"
                  ? <><XCircle className="h-4 w-4" /> ACCESS DENIED</>
                  : <><AlertTriangle className="h-4 w-4" /> ENTRY BLOCKED</>)}
              {outcomeColor === "warning" && <><AlertTriangle className="h-4 w-4" /> MANUAL REVIEW REQUIRED</>}
            </div>
          )}
          <p className="text-2xl font-bold leading-relaxed text-foreground">{narrative}</p>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {(phase === "welcome" || phase === "complete") && (
            <>
              <Button size="lg" onClick={handleCapture} className="gap-2">
                <Camera className="h-4 w-4" />
                {phase === "complete" ? "Scan Next Vehicle" : "Scan Vehicle"}
              </Button>
              <Button size="lg" variant="outline" onClick={() => { primeAudio(); fileInputRef.current?.click(); }} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
            </>
          )}

          {phase === "face_scan" && (
            <>
              <Button size="lg" onClick={handleFaceCapture} className="gap-2">
                <Camera className="h-4 w-4" />
                Scan Face
              </Button>
              <Button size="lg" variant="outline" onClick={() => { primeAudio(); fileInputRef.current?.click(); }} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload a Photo of My Face
              </Button>
              <Button size="sm" variant="ghost" onClick={resetKiosk}>
                Back to Start
              </Button>
            </>
          )}

          {(phase === "scanning" || phase === "face_validating") && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {phase === "face_validating" ? "Checking face..." : scanKind === "face" ? "Verifying identity..." : "Analyzing..."}
            </div>
          )}

          {phase === "error" && (
            <>
              <Button
                size="lg"
                onClick={() => {
                  if (scanKind === "face" && vehicleFileRef.current) {
                    journeySeqRef.current++;
                    setErrorMessage(null);
                    setFacePreviewUrl(null);
                    setPhase("face_scan");
                    setNarrative("Please try scanning your face again.");
                  } else {
                    handleCapture();
                  }
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button size="sm" variant="ghost" onClick={resetKiosk}>
                Back to Start
              </Button>
            </>
          )}

          {phase === "complete" && (
            <Button size="sm" variant="ghost" onClick={resetKiosk} className="gap-1.5">
              <ScanLine className="h-3.5 w-3.5" /> Reset
            </Button>
          )}

          {phase === "complete" && apiResult?.gate?.success === false && direction === "entry" && revealDecision && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClearSession}
              disabled={forceClose.isPending}
              className="gap-1.5"
            >
              {forceClose.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              {forceClose.isPending ? "Clearing..." : "Clear Stuck Session"}
            </Button>
          )}
        </div>

        {/* Result detail card */}
        {phase === "complete" && result && apiResult && (
          <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-elevated/60 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Plate</p>
              <p className="mt-1 font-mono text-lg font-bold">{result.ocr.cleaned || result.ocr.raw || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{(result.ocr.confidence * 100).toFixed(0)}% confidence</p>
            </div>
            <div className="rounded-xl border border-border bg-elevated/60 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Face</p>
              <p className="mt-1 text-lg font-bold">
                {faceDenied ? "Not verified" : !requireFace ? "Not required" : apiResult.face?.detected ? "Captured" : "Not captured"}
              </p>
              <p className="text-xs text-muted-foreground">
                {faceDenied
                  ? "Could not capture after retries"
                  : !requireFace
                    ? "Face not part of this check"
                    : apiResult.face?.similarity
                      ? `${apiResult.face.similarity.toFixed(0)}% match`
                      : "No match data"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-elevated/60 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Recommended</p>
              <p className="mt-1 text-sm font-semibold">{result.decision.recommendedAction}</p>
              <p className="text-xs text-muted-foreground">Attempt {Math.max(attempts, 1)}</p>
            </div>
          </div>
        )}

        {errorMessage && phase === "error" && (
          <p className="max-w-lg text-center text-xs text-muted-foreground">{errorMessage}</p>
        )}

        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/50">
          <Eye className="h-3 w-3" /> Attempt {Math.max(attempts, 1)} · {requireFace ? "Face capture required" : "Face optional"}
          {direction === "entry" ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            if (phaseRef.current === "face_scan" || phaseRef.current === "face_validating") handleFaceUpload(f);
            else handleUpload(f);
          }
          e.target.value = "";
        }}
      />
    </motion.div>
  );
}

export { LiveGateOverlay };
