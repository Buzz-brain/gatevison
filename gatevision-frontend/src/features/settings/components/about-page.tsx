import { motion } from "framer-motion";
import {
  Shield,
  ExternalLink,
  Server,
  Globe,
  Code2,
  Terminal,
  Database,
  ScanLine,
  Eye,
  BrainCircuit,
  Zap,
  Calendar,
  Users,
  FileText,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer, staggerItem, fadeIn } from "@/lib/animations";
import { MOCK_ABOUT } from "../mocks/data";
import { formatDate } from "../utils";

const VERSION_ICONS: Record<string, typeof Server> = {
  frontend: Globe,
  backend: Server,
  python: Terminal,
  fastapi: Zap,
  mongodb: Database,
  yolo: ScanLine,
  easyocr: Eye,
  insightface: BrainCircuit,
  resnet50: Code2,
};

const VERSION_LABELS: Record<string, string> = {
  frontend: "Frontend (React + Vite)",
  backend: "Backend API",
  python: "Python Runtime",
  fastapi: "FastAPI Framework",
  mongodb: "MongoDB",
  yolo: "YOLOv8 (Detection)",
  easyocr: "EasyOCR (Plate OCR)",
  insightface: "InsightFace (Face Recognition)",
  resnet50: "ResNet-50 (Vehicle Fingerprint)",
};

function AboutPage() {
  const prefersReduced = useReducedMotion();
  const about = MOCK_ABOUT;

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={prefersReduced ? undefined : fadeIn} initial={prefersReduced ? undefined : "hidden"} animate="visible">
        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-10 text-center">
            <motion.div
              initial={prefersReduced ? undefined : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20"
            >
              <Shield className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">GateVision</h1>
            <p className="mt-1 text-sm text-muted-foreground">AI Vehicle Access Control System</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <Badge variant="default">v{about.version.frontend}</Badge>
              <Badge variant="success" size="sm">Stable</Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : staggerItem} initial={prefersReduced ? undefined : "hidden"} animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-primary" />
              Version Information
            </CardTitle>
            <CardDescription>Component versions across the full stack</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(about.version).map(([key, version], idx) => {
                const Icon = VERSION_ICONS[key] ?? Server;
                const label = VERSION_LABELS[key] ?? key;
                return (
                  <motion.div
                    key={key}
                    initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: prefersReduced ? 0 : idx * 0.04, duration: 0.2 }}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/50 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <Badge variant="outline" size="sm" className="font-mono">
                      v{version}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={prefersReduced ? undefined : staggerItem} initial={prefersReduced ? undefined : "hidden"} animate="visible">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-warning" />
                License
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface/50 p-4">
                <Award className="h-8 w-8 text-warning/70" />
                <div>
                  <p className="font-medium">{about.license}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    Permissive open-source license
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : staggerItem} initial={prefersReduced ? undefined : "hidden"} animate="visible">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                Repository
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface/50 p-4">
                <Code2 className="h-8 w-8 text-primary/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium font-mono text-sm">{about.repository}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">Source code repository</p>
                </div>
                <Button variant="ghost" size="icon-xs" className="shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={prefersReduced ? undefined : staggerItem} initial={prefersReduced ? undefined : "hidden"} animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-success" />
              Credits
            </CardTitle>
            <CardDescription>Open-source projects and teams that power GateVision</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {about.credits.map((credit, idx) => (
                <motion.div
                  key={credit}
                  initial={prefersReduced ? undefined : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: prefersReduced ? 0 : idx * 0.05, duration: 0.2 }}
                >
                  <Badge variant="outline" className="py-1 px-3">
                    {credit}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : staggerItem} initial={prefersReduced ? undefined : "hidden"} animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-info" />
              Authors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {about.authors.map((author, idx) => (
                <div
                  key={author}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface/50 px-4 py-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {author.charAt(0)}
                  </div>
                  <span className="text-sm">{author}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : staggerItem} initial={prefersReduced ? undefined : "hidden"} animate="visible">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Build Date
              </div>
              <span className="font-mono text-sm">{formatDate(about.buildDate)}</span>
            </div>
            <Separator className="my-3" />
            <p className="text-center text-xs text-muted-foreground/50">
              GateVision AI Vehicle Access Control System. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { AboutPage };
