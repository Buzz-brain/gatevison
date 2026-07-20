import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { fadeIn } from "@/lib/animations";
import { Download, Upload, RotateCcw, FlaskConical, History, Scale, AlertTriangle, Gauge } from "lucide-react";
import { useSettings } from "@/features/settings/hooks/use-settings";
import type { SettingCategory, SettingDefinition } from "@/features/settings/types";
import { SETTING_CATEGORIES } from "@/features/settings/types";
import { SettingsSidebar } from "@/features/settings/components/settings-sidebar";
import { SettingsSearch } from "@/features/settings/components/settings-search";
import { GeneralSettings } from "@/features/settings/components/general-settings";
import { AiSettings } from "@/features/settings/components/ai-settings";
import { RecognitionSettings } from "@/features/settings/components/recognition-settings";
import { DecisionSettings } from "@/features/settings/components/decision-settings";
import { CameraSettings } from "@/features/settings/components/camera-settings";
import { GateSettings } from "@/features/settings/components/gate-settings";
import { SecuritySettings } from "@/features/settings/components/security-settings";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { StorageSettings } from "@/features/settings/components/storage-settings";
import { BackupSettings } from "@/features/settings/components/backup-settings";
import { MonitoringSettings } from "@/features/settings/components/monitoring-settings";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { AdvancedSettings } from "@/features/settings/components/advanced-settings";
import { AboutPage } from "@/features/settings/components/about-page";
import { ConfigurationHistory } from "@/features/settings/components/configuration-history";
import { ConfigValidator } from "@/features/settings/components/config-validator";
import { ConfigImpact } from "@/features/settings/components/config-impact";
import { ComparisonTable } from "@/features/settings/components/comparison-table";
import { ResetCenter } from "@/features/settings/components/reset-center";
import { AiConfigSimulator } from "@/features/settings/components/ai-config-simulator";


function SettingsPage() {
  const reduced = useReducedMotion();
  const s = useSettings();

  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showValidator, setShowValidator] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const sidebarVisible = true;

  const renderContent = () => {
    switch (s.activeTab) {
      case "general": return <GeneralSettings />;
      case "ai-models": return <AiSettings />;
      case "recognition": return <RecognitionSettings />;
      case "decision-engine": return <DecisionSettings weights={s.weights} onUpdateWeights={s.updateWeights} decisionPreview={s.decisionPreview} />;
      case "cameras": return <CameraSettings cameras={s.cameras} onUpdateCamera={s.updateCameras} />;
      case "gate-control": return <GateSettings gateConfig={s.gateConfig} onSetGateConfig={s.setGateConfig} />;
      case "security": return <SecuritySettings security={s.security} onSetSecurity={s.setSecurity} />;
      case "notifications": return <NotificationSettings notifications={s.notifications} onSetNotifications={s.setNotifications} />;
      case "storage": return <StorageSettings />;
      case "backup": return <BackupSettings />;
      case "monitoring": return <MonitoringSettings />;
      case "appearance": return <AppearanceSettings />;
      case "advanced": return <AdvancedSettings />;
      case "about": return <AboutPage />;
      default: return <GeneralSettings />;
    }
  };

  const handleSearchSelect = (setting: SettingDefinition) => {
    s.setActiveTab(setting.category);
  };

  return (
    <PageContainer>
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings & Configuration</h1>
            <p className="text-sm text-muted-foreground">Configure every subsystem of the GateVision platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="success" size="sm" onClick={() => setShowSimulator(true)}>
              <FlaskConical className="mr-1 h-4 w-4" />AI Simulator
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="mr-1 h-4 w-4" />Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
              <Download className="mr-1 h-4 w-4" />Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="mr-1 h-4 w-4" />History
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SettingsSearch onSelect={handleSearchSelect} />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowValidator(true)}>
            <AlertTriangle className="mr-1 h-4 w-4" />Validate
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowImpact(true)}>
            <Gauge className="mr-1 h-4 w-4" />Impact
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComparison(true)}>
            <Scale className="mr-1 h-4 w-4" />Compare
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowReset(true)}>
            <RotateCcw className="mr-1 h-4 w-4" />Reset
          </Button>
        </div>

        <div className="flex gap-4">
          {sidebarVisible && (
            <div className="w-56 shrink-0">
              <SettingsSidebar activeTab={s.activeTab} onTabChange={(tab: SettingCategory) => s.setActiveTab(tab)} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={s.activeTab}
                initial={reduced ? {} : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? {} : { opacity: 0, y: -4 }}
                transition={{ duration: reduced ? 0 : 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <Dialog open={showImport} onClose={() => setShowImport(false)} title="Import Configuration" description="Upload a JSON configuration file to restore settings">
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Drop JSON file here or click to browse</p>
          </div>
          <div className="rounded-lg bg-elevated p-3 text-sm">
            <p className="font-medium">Preview Changes</p>
            <p className="mt-1 text-muted-foreground">No file selected. Upload a valid configuration JSON to preview changes.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button disabled>Import</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showExport} onClose={() => setShowExport(false)} title="Export Configuration" description="Download current settings as JSON">
        <div className="space-y-4">
          <div className="rounded-lg bg-elevated p-4">
            <p className="text-sm font-medium">Export Includes:</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {SETTING_CATEGORIES.map((cat) => (
                <li key={cat.id} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />{cat.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowExport(false)}>Cancel</Button>
            <Button onClick={() => setShowExport(false)}>
              <Download className="mr-1 h-4 w-4" />Export JSON
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showHistory} onClose={() => setShowHistory(false)} title="Configuration History" className="max-w-2xl">
        <ConfigurationHistory entries={s.history} />
      </Dialog>

      <Dialog open={showValidator} onClose={() => setShowValidator(false)} title="Configuration Validator" description="Review warnings and recommendations" className="max-w-xl">
        <ConfigValidator validations={s.validations} />
      </Dialog>

      <Dialog open={showImpact} onClose={() => setShowImpact(false)} title="Configuration Impact Preview" className="max-w-xl">
        <ConfigImpact impact={s.impact} />
      </Dialog>

      <Dialog open={showComparison} onClose={() => setShowComparison(false)} title="Configuration Comparison" className="max-w-3xl">
        <ComparisonTable />
      </Dialog>

      <Dialog open={showReset} onClose={() => setShowReset(false)} title="Reset Center" className="max-w-xl">
        <ResetCenter />
      </Dialog>

      <Dialog open={showSimulator} onClose={() => setShowSimulator(false)} title="AI Configuration Simulator" className="max-w-5xl">
        <AiConfigSimulator
          weights={s.weights}
          onWeightsChange={s.updateWeights}
          yoloConfidence={s.models.find((m) => m.id === "yolo")?.confidenceThreshold ?? 0.65}
          ocrThreshold={s.recognition.ocr.minConfidence}
          faceThreshold={s.recognition.faceRecognition.similarityThreshold}
          metrics={s.simulatorMetrics}
          impact={s.impact}
        />
      </Dialog>
    </PageContainer>
  );
}

export { SettingsPage };
