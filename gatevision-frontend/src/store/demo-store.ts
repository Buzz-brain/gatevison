import { create } from "zustand";
import type { ScenarioId, DemoView, MetricsSnapshot, PlaybackFrame, Scenario } from "@/features/demo/types";
import { SCENARIOS, generatePlaybackFrames, generateMetricsHistory } from "@/features/demo/constants";
import { generateMetricsTick } from "@/features/demo/utils";

interface DemoStep {
  id: string;
  label: string;
  narration: string;
  duration: number;
  highlight?: string;
  confidence?: number;
  icon?: string;
}

const DEMO_STEPS: DemoStep[] = [
  { id: "boot", label: "System Boot", narration: "GateVision AI system initializing all security subsystems...", duration: 1500 },
  { id: "camera", label: "Camera Online", narration: "LPR camera 01 is now online. Monitoring approach lane at 30 fps.", duration: 1200 },
  { id: "vehicle_arrives", label: "Vehicle Detected", narration: "Vehicle detected approaching Gate A at 8 km/h. Triggering capture sequence.", duration: 1000, confidence: 98.7, icon: "car" },
  { id: "plate_detection", label: "License Plate Detection", narration: "License plate detected in camera frame. Plate region isolated for OCR processing.", duration: 1500, confidence: 97.2, icon: "scan" },
  { id: "ocr", label: "Optical Character Recognition", narration: "OCR engine processing plate region. Character segmentation and recognition complete.", duration: 1200, confidence: 99.1, icon: "file-text" },
  { id: "face_recognition", label: "Facial Recognition", narration: "Driver face captured and aligned. Matching against registered identities in database.", duration: 1500, confidence: 99.1, icon: "user" },
  { id: "vehicle_fingerprint", label: "Vehicle Fingerprinting", narration: "Vehicle make, model, color, and unique identifiers analyzed. Comparing against enrolled vehicle profiles.", duration: 1200, confidence: 96.4, icon: "truck" },
  { id: "identity_verification", label: "Identity Verification", narration: "Cross-referencing driver identity, vehicle registration, and access policy. All evidence correlated.", duration: 1000, confidence: 99.1, icon: "fingerprint" },
  { id: "decision_engine", label: "Decision Engine", narration: "Decision engine evaluating: plate match (99.1%), face match (99.1%), vehicle match (96.4%), access policy compliance. Verdict: ACCESS GRANTED.", duration: 1500, confidence: 99.8, icon: "check-circle" },
  { id: "gate_opens", label: "Gate Opens", narration: "Gate A opening. Vehicle authorized to proceed. Barrier raised in 2.3 seconds.", duration: 1000, icon: "gate" },
  { id: "vehicle_enters", label: "Vehicle Enters", narration: "Vehicle ABC-123XY entering premises. Entry timestamp recorded. Session started.", duration: 1000, icon: "arrow-right" },
  { id: "dashboard_update", label: "Dashboard Updates", narration: "Live dashboard updating with new entry metrics. Daily traffic count incrementing.", duration: 800 },
  { id: "reports_update", label: "Reports Updated", narration: "Analytics pipeline processing entry data. Hourly traffic report refreshing.", duration: 800 },
  { id: "admin_notification", label: "Administration Notification", narration: "Security command center notified of completed access event. Audit trail recorded.", duration: 800 },
  { id: "mission_replay", label: "Mission Replay", narration: "Complete access sequence captured for replay. All evidence packaged for audit.", duration: 800 },
  { id: "traffic_playback", label: "Traffic Playback", narration: "Traffic flow analytics updated. Gate throughput metrics calculated. Demo sequence complete.", duration: 1000 },
  { id: "complete", label: "Demo Complete", narration: "GateVision AI demonstration completed successfully. All systems operational. Ready for next access request.", duration: 2000 },
];

interface DemoScenarioStore {
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  isPaused: boolean;
  steps: DemoStep[];

  activeView: DemoView;
  selectedScenario: ScenarioId | null;
  isAutoRunning: boolean;
  autoProgress: number;
  judgeMode: boolean;
  metricsHistory: MetricsSnapshot[];
  playbackFrames: PlaybackFrame[];
  playbackPosition: number;
  isPlaying: boolean;
  playbackSpeed: number;

  startDemo: () => void;
  stopDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (index: number) => void;
  resetDemo: () => void;
  togglePause: () => void;

  setView: (view: DemoView) => void;
  selectScenario: (id: ScenarioId | null) => void;
  setAutoRunning: (v: boolean) => void;
  setAutoProgress: (v: number) => void;
  setJudgeMode: (v: boolean) => void;
  addMetricsTick: () => void;
  setPlaybackPosition: (n: number) => void;
  setIsPlaying: (v: boolean) => void;
  setPlaybackSpeed: (n: number) => void;
}

export const useDemoStore = create<DemoScenarioStore>((set, get) => ({
  isActive: false,
  currentStep: 0,
  isCompleted: false,
  isPaused: false,
  steps: DEMO_STEPS,

  activeView: "scenarios",
  selectedScenario: null,
  isAutoRunning: false,
  autoProgress: 0,
  judgeMode: false,
  metricsHistory: generateMetricsHistory(),
  playbackFrames: generatePlaybackFrames(),
  playbackPosition: 0,
  isPlaying: false,
  playbackSpeed: 1,

  startDemo: () => set({ isActive: true, currentStep: 0, isCompleted: false, isPaused: false }),
  stopDemo: () => set({ isActive: false, currentStep: 0, isCompleted: false, isPaused: false }),
  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) set({ currentStep: currentStep + 1 });
    else set({ isCompleted: true });
  },
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) set({ currentStep: currentStep - 1 });
  },
  setStep: (index: number) => set({ currentStep: index }),
  resetDemo: () => set({ currentStep: 0, isCompleted: false, isPaused: false }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  setView: (view) => set({ activeView: view }),
  selectScenario: (id) => set({ selectedScenario: id, activeView: id ? "scenarios" : "scenarios" }),
  setAutoRunning: (v) => set({ isAutoRunning: v, autoProgress: v ? 0 : 100 }),
  setAutoProgress: (v) => set({ autoProgress: v }),
  setJudgeMode: (v) => set({ judgeMode: v }),
  addMetricsTick: () => {
    const { metricsHistory } = get();
    const last = metricsHistory[metricsHistory.length - 1];
    const tick = generateMetricsTick(last);
    set({ metricsHistory: [...metricsHistory.slice(-59), tick] });
  },
  setPlaybackPosition: (n) => set({ playbackPosition: n }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setPlaybackSpeed: (n) => set({ playbackSpeed: n }),
}));

export function getScenarioById(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
