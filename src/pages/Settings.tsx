import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, FileText, Building2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { getSettings, saveSettings } from "@/lib/storage";
import type { Settings } from "@/lib/storage";

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(getSettings());

  const handleSave = () => {
    saveSettings(s);
    toast.success("Settings saved!");
  };

  const update = (field: keyof Settings, value: string) => {
    setS((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your importer details and contract preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-600" /> Importer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={s.importerName} onChange={(e) => update("importerName", e.target.value)} className="mt-1" /></div>
              <div><Label>ID Number</Label><Input value={s.importerId} onChange={(e) => update("importerId", e.target.value)} className="mt-1" /></div>
              <div><Label>Mobile Number</Label><Input value={s.importerMobile} onChange={(e) => update("importerMobile", e.target.value)} className="mt-1" /></div>
              <div><Label>Business Name</Label><Input value={s.importerBusinessName} onChange={(e) => update("importerBusinessName", e.target.value)} className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Contract Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Contract Number Prefix</Label><Input value={s.contractNumberPrefix} onChange={(e) => update("contractNumberPrefix", e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Default Payment Method</Label>
                <select value={s.defaultPaymentMethod} onChange={(e) => update("defaultPaymentMethod", e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm">
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save Settings</Button>
        </div>
      </div>
      <Toaster position="top-right" />
    </Layout>
  );
}
