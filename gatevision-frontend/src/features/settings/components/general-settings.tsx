import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Globe, Calendar, Ruler, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { MOCK_SETTINGS } from "../mocks/data";

function getSetting(id: string) {
  const found = MOCK_SETTINGS.find((s) => s.id === id);
  return found?.defaultValue;
}

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern (EST/EDT)" },
  { value: "America/Chicago", label: "Central (CST/CDT)" },
  { value: "America/Denver", label: "Mountain (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Pacific (PST/PDT)" },
];

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const UNIT_OPTIONS = [
  { value: "imperial", label: "Imperial (ft, mph)" },
  { value: "metric", label: "Metric (m, km/h)" },
];

function GeneralSettings() {
  const prefersReduced = useReducedMotion();

  const [orgName, setOrgName] = useState(
    () => String(getSetting("org-name") ?? "GateVision Security"),
  );
  const [facilityName, setFacilityName] = useState(
    () => String(getSetting("facility-name") ?? "GateVision HQ"),
  );
  const [timezone, setTimezone] = useState(
    () => String(getSetting("timezone") ?? "America/New_York"),
  );
  const [language, setLanguage] = useState(
    () => String(getSetting("language") ?? "en-US"),
  );
  const [dateFormat, setDateFormat] = useState(
    () => String(getSetting("date-format") ?? "MM/DD/YYYY"),
  );
  const [units, setUnits] = useState(
    () => String(getSetting("measurement-units") ?? "imperial"),
  );
  const [autoSave, setAutoSave] = useState(
    () => Boolean(getSetting("auto-save")),
  );

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={prefersReduced ? undefined : staggerItem}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Organization</CardTitle>
                <CardDescription>Basic organization and facility details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facility-name">Facility Name</Label>
                <Input
                  id="facility-name"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="Enter facility name"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : staggerItem}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Locale & Format</CardTitle>
                <CardDescription>Regional and formatting preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  options={TIMEZONE_OPTIONS}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  options={LANGUAGE_OPTIONS}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select
                  id="date-format"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  options={DATE_FORMAT_OPTIONS}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Measurement Units</Label>
                <Select
                  id="units"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  options={UNIT_OPTIONS}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : staggerItem}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Save className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Data & Saving</CardTitle>
                <CardDescription>Automatic save and data management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Save</Label>
                <p className="text-xs text-muted-foreground/60">
                  Automatically save configuration changes as you make them
                </p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { GeneralSettings };
