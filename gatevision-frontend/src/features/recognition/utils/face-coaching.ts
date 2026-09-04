export type LandmarkPoint = [number, number];

export interface LandmarkData {
  bbox: number[];
  landmarks: LandmarkPoint[]; // [leftEye, rightEye, nose, mouthLeft, mouthRight]
  confidence: number;
}

export interface Coaching {
  score: number;
  scoreLabel: "TRACKING" | "GOOD" | "ADJUST" | "LOW";
  centering: string | null;
  distance: string | null;
  tilt: string | null;
  confidenceHint: string | null;
  messages: string[];
  eyeLineAngleDeg: number;
  centerOffsetX: number;
  centerOffsetY: number;
  isCentered: boolean;
  isGoodDistance: boolean;
  isLevel: boolean;
  ready: boolean;
}

interface CoachingParams {
  minEyeFraction: number; // too close if inter-eye span > this fraction of frame width
  maxEyeFraction: number; // too far if inter-eye span < this fraction of frame width
  centerTolerance: number; // fraction of frame dim, offset above this -> move
  maxTiltDeg: number;
  minConfidence: number;
}

const DEFAULT_PARAMS: CoachingParams = {
  minEyeFraction: 0.42,
  maxEyeFraction: 0.16,
  centerTolerance: 0.16,
  maxTiltDeg: 12,
  minConfidence: 0.55,
};

function dist(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function assessFace(
  data: LandmarkData,
  frameWidth: number,
  frameHeight: number,
  params: CoachingParams = DEFAULT_PARAMS,
): Coaching {
  const messages: string[] = [];
  let centering: string | null = null;
  let distance: string | null = null;
  let tilt: string | null = null;
  let confidenceHint: string | null = null;

  const [lx, ly] = data.landmarks[0] ?? [0, 0];
  const [rx, ry] = data.landmarks[1] ?? [0, 0];
  const [nx, ny] = data.landmarks[2] ?? [0, 0];
  const [mx, my] = data.landmarks[3] ?? [0, 0];
  const [sx, sy] = data.landmarks[4] ?? [0, 0];

  const eyeMidX = (lx + rx) / 2;
  const eyeMidY = (ly + ry) / 2;
  const mouthMidX = (mx + sx) / 2;
  const mouthMidY = (my + sy) / 2;
  const faceCX = (nx + eyeMidX + mouthMidX) / 3;
  const faceCY = (ny + eyeMidY + mouthMidY) / 3;

  const centerX = frameWidth / 2;
  const centerY = frameHeight / 2;
  const offsetX = faceCX - centerX;
  const offsetY = faceCY - centerY;

  const eyeSpan = dist([lx, ly], [rx, ry]);
  const normSpan = eyeSpan / frameWidth;

  const eyeLineAngleDeg = (Math.atan2(ry - ly, rx - lx) * 180) / Math.PI;
  const tiltAbs = Math.abs(eyeLineAngleDeg);

  let isCentered = true;
  let isGoodDistance = true;
  let isLevel = true;
  const ready = data.confidence >= DEFAULT_PARAMS.minConfidence;

  const adjX = Math.abs(offsetX) / frameWidth >= params.centerTolerance;
  const adjY = Math.abs(offsetY) / frameHeight >= params.centerTolerance;
  if (adjX || adjY) {
    isCentered = false;
    const parts: string[] = [];
    if (offsetX < 0) parts.push("move right");
    else if (offsetX > 0) parts.push("move left");
    if (offsetY < 0) parts.push("move up");
    else if (offsetY > 0) parts.push("move down");
    centering = parts.length
      ? `Your face is off-center — ${parts.join(" and ")}.`
      : "Your face is off-center.";
    messages.push(centering);
  }

  if (normSpan > params.minEyeFraction) {
    isGoodDistance = false;
    distance = "You are too close — move further back.";
    messages.push(distance);
  } else if (normSpan < params.maxEyeFraction) {
    isGoodDistance = false;
    distance = "You are too far — move closer.";
    messages.push(distance);
  }

  if (tiltAbs > params.maxTiltDeg) {
    isLevel = false;
    tilt = "Your head is tilted — straighten it and look ahead.";
    messages.push(tilt);
  }

  if (!ready) {
    confidenceHint = "I cannot see your face clearly — look directly at the camera and improve the lighting.";
    messages.push(confidenceHint);
  }

  const shifts = [centering, distance, tilt, confidenceHint].filter(Boolean).length;
  const componentScore = Math.max(0, 1 - shifts * 0.34);
  const score = Math.round(Math.min(1, Math.max(0, componentScore)) * 100);

  let scoreLabel: Coaching["scoreLabel"] = "TRACKING";
  if (messages.length === 0) scoreLabel = "GOOD";
  else if (score >= 50) scoreLabel = "ADJUST";
  else scoreLabel = "LOW";

  return {
    score,
    scoreLabel,
    centering,
    distance,
    tilt,
    confidenceHint,
    messages,
    eyeLineAngleDeg: Math.round(eyeLineAngleDeg),
    centerOffsetX: offsetX,
    centerOffsetY: offsetY,
    isCentered,
    isGoodDistance,
    isLevel,
    ready,
  };
}
