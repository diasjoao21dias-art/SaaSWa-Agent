import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  
  const handleSave = (section: string) => {
    toast({ title: `${section} settings saved` });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="AI Agent Hub" />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" defaultValue="https://example.com" />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="pst">PST</SelectItem>
                    <SelectItem value="est">EST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => handleSave('General')} data-testid="button-save-general">Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Email Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">New Conversations</p>
                  <p className="text-xs text-muted-foreground">Get notified when a new conversation starts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Agent Assignments</p>
                  <p className="text-xs text-muted-foreground">Get notified when an agent is assigned</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Payment Updates</p>
                  <p className="text-xs text-muted-foreground">Get notified about payment status changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Weekly Reports</p>
                  <p className="text-xs text-muted-foreground">Receive weekly performance summaries</p>
                </div>
                <Switch />
              </div>
            </div>
            <Button onClick={() => handleSave('Notification')} data-testid="button-save-notifications">Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Password & Authentication</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="2fa" />
                <Label htmlFor="2fa">Enable Two-Factor Authentication</Label>
              </div>
            </div>
            <Button onClick={() => handleSave('Security')} data-testid="button-save-security">Update Password</Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Display Preferences</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select defaultValue="mdy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select defaultValue="12">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12-hour</SelectItem>
                    <SelectItem value="24">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="compactView" />
                <Label htmlFor="compactView">Compact View</Label>
              </div>
            </div>
            <Button onClick={() => handleSave('Appearance')} data-testid="button-save-appearance">Save Changes</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
