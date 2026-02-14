"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/Switch";
import { Settings, Users, Database, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Admin & Configuration</h1>
        <p className="text-sm text-gray-600 mt-1">Manage system settings and preferences</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                <p className="text-sm text-gray-600">Configure basic system preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="confidence">Minimum Confidence Threshold (%)</Label>
                <Input id="confidence" type="number" defaultValue="80" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="batch">Default Batch Size</Label>
                <Input id="batch" type="number" defaultValue="100" className="mt-1" />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="auto-match">Enable Auto-Matching</Label>
                <Switch id="auto-match" defaultChecked />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="auto-post">Enable Auto-Posting</Label>
                <Switch id="auto-post" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-600">Manage users and permissions</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Roles & Permissions
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
                <p className="text-sm text-gray-600">Configure email processing settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Inbox Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="remittances@company.com"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="email-notify">Email Notifications</Label>
                <Switch id="email-notify" defaultChecked />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
                <p className="text-sm text-gray-600">Configure data retention and backup</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Backup Settings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear Cache
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
