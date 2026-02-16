"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Save,
  Globe,
  Clock,
  Shield,
  Bell,
  Database,
  Palette,
  Mail,
  Key,
} from "lucide-react";

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Acme Corporation");
  const [timezone, setTimezone] = useState("America/New_York");
  const [currency, setCurrency] = useState("USD");
  const [fiscalYearEnd, setFiscalYearEnd] = useState("December");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [passwordExpiry, setPasswordExpiry] = useState("90");
  const [smtpHost, setSmtpHost] = useState("smtp.company.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [fromEmail, setFromEmail] = useState("noreply@meeru.ai");
  const [dataRetention, setDataRetention] = useState("365");
  const [backupFrequency, setBackupFrequency] = useState("daily");

  const [securityToggles, setSecurityToggles] = useState<SettingToggle[]>([
    { id: "mfa", label: "Require MFA for all users", description: "Enforce multi-factor authentication across the organization", enabled: true },
    { id: "sso", label: "SSO Authentication", description: "Enable Single Sign-On via SAML 2.0 or OIDC", enabled: true },
    { id: "ip_restrict", label: "IP Allowlist", description: "Restrict access to approved IP ranges only", enabled: false },
    { id: "audit_login", label: "Audit all login attempts", description: "Log successful and failed authentication events", enabled: true },
  ]);

  const [notificationToggles, setNotificationToggles] = useState<SettingToggle[]>([
    { id: "email_notify", label: "Email notifications", description: "Send email alerts for workflow events and exceptions", enabled: true },
    { id: "slack_notify", label: "Slack notifications", description: "Push alerts to configured Slack channels", enabled: false },
    { id: "daily_digest", label: "Daily digest", description: "Send daily summary email to managers at 8:00 AM", enabled: true },
    { id: "critical_alert", label: "Critical alerts", description: "Immediately notify admins of critical system events", enabled: true },
  ]);

  const [aiToggles, setAiToggles] = useState<SettingToggle[]>([
    { id: "ai_matching", label: "AI Auto-Matching", description: "Enable AI-powered transaction matching in Cash Application", enabled: true },
    { id: "ai_narratives", label: "AI Narrative Generation", description: "Auto-generate financial narratives and commentary", enabled: true },
    { id: "ai_anomaly", label: "Anomaly Detection", description: "Real-time AI anomaly detection across all modules", enabled: true },
    { id: "ai_suggestions", label: "AI Suggestions", description: "Show AI-powered action suggestions in worklist", enabled: false },
  ]);

  const toggleSetting = (toggles: SettingToggle[], setToggles: React.Dispatch<React.SetStateAction<SettingToggle[]>>, id: string) => {
    setToggles(toggles.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-[#1B2A41]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure organization-wide settings and preferences</p>
        </div>
        <Button className="bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-blue-600" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Organization Name</label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Timezone</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                  <SelectItem value="Europe/London">GMT</SelectItem>
                  <SelectItem value="Asia/Tokyo">JST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Base Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date Format</label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Fiscal Year End</label>
              <Select value={fiscalYearEnd} onValueChange={setFiscalYearEnd}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="March">March</SelectItem>
                  <SelectItem value="June">June</SelectItem>
                  <SelectItem value="September">September</SelectItem>
                  <SelectItem value="December">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-red-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Session Timeout (min)</label>
                <Input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="mt-1" type="number" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Max Login Attempts</label>
                <Input value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} className="mt-1" type="number" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password Expiry (days)</label>
              <Input value={passwordExpiry} onChange={(e) => setPasswordExpiry(e.target.value)} className="mt-1" type="number" />
            </div>
            <div className="space-y-3 pt-2">
              {securityToggles.map((toggle) => (
                <div key={toggle.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{toggle.label}</p>
                    <p className="text-xs text-gray-500">{toggle.description}</p>
                  </div>
                  <ToggleSwitch enabled={toggle.enabled} onToggle={() => toggleSetting(securityToggles, setSecurityToggles, toggle.id)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-4 h-4 text-amber-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">SMTP Host</label>
              <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">SMTP Port</label>
                <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">From Email</label>
                <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {notificationToggles.map((toggle) => (
                <div key={toggle.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{toggle.label}</p>
                    <p className="text-xs text-gray-500">{toggle.description}</p>
                  </div>
                  <ToggleSwitch enabled={toggle.enabled} onToggle={() => toggleSetting(notificationToggles, setNotificationToggles, toggle.id)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI & Data Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-4 h-4 text-purple-600" />
              AI & Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Retention (days)</label>
                <Input value={dataRetention} onChange={(e) => setDataRetention(e.target.value)} className="mt-1" type="number" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Backup Frequency</label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {aiToggles.map((toggle) => (
                <div key={toggle.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{toggle.label}</p>
                    <p className="text-xs text-gray-500">{toggle.description}</p>
                  </div>
                  <ToggleSwitch enabled={toggle.enabled} onToggle={() => toggleSetting(aiToggles, setAiToggles, toggle.id)} />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-purple-700">AI Model Configuration</p>
              </div>
              <p className="text-xs text-purple-600">Current model: Claude Opus 4.6 | API calls today: 1,247 | Avg latency: 340ms</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
