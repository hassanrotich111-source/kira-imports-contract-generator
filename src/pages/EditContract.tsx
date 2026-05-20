import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Plus, Trash2, Upload, FileText, ChevronDown, ChevronUp, X, ArrowLeft, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { getContract, getSettings, updateContract, calcTotals } from "@/lib/storage";
import { fileToBase64 } from "@/lib/storage";
import type { Equipment } from "@/lib/storage";
import { generateContractPdf, downloadPdf } from "@/lib/pdfGenerator";

export default function EditContract() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const existing = getContract(id || "");
  const settings = getSettings();

  const [buyerName, setBuyerName] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [buyerMobile, setBuyerMobile] = useState("");
  const [buyerBusinessName, setBuyerBusinessName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank transfer");
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setBuyerName(existing.buyerName);
      setBuyerId(existing.buyerId);
      setBuyerMobile(existing.buyerMobile);
      setBuyerBusinessName(existing.buyerBusinessName);
      setPaymentMethod(existing.paymentMethod);
      setEquipments(existing.equipments.map((e) => ({ ...e })));
    }
  }, [existing]);

  const { totalBP, totalShipping, totalImporterFee, grandTotal, upfrontPayment } = calcTotals(equipments);

  const addEq = () => setEquipments([...equipments, { id: crypto.randomUUID(), name: "", description: "", imageData: "", buyingPrice: 0, shippingFee: 0, importerFee: 0, quantity: 1 }]);
  const removeEq = (idx: number) => { if (equipments.length > 1) setEquipments(equipments.filter((_, i) => i !== idx)); };
  const updateEq = (idx: number, field: keyof Equipment, value: unknown) => {
    const u = [...equipments]; u[idx] = { ...u[idx], [field]: value }; setEquipments(u);
  };
  const handleImage = async (idx: number, file: File) => {
    updateEq(idx, "imageData", await fileToBase64(file));
  };

  const handleSave = async () => {
    if (!existing) return;
    if (!buyerName.trim()) { toast.error("Buyer name required"); return; }
    const valid = equipments.filter((e) => e.name.trim());
    if (valid.length === 0) { toast.error("Add at least one equipment"); return; }

    setSaving(true);
    updateContract(existing.id, {
      buyerName, buyerId, buyerMobile, buyerBusinessName,
      paymentMethod, equipments: valid,
    });

    // Regenerate PDF
    try {
      const updated = getContract(existing.id);
      if (updated) {
        const bytes = await generateContractPdf(updated, settings);
        downloadPdf(bytes, `${updated.contractNumber}.pdf`);
        toast.success("Saved and PDF regenerated!");
        navigate(`/preview/${existing.id}`);
      }
    } catch (e) {
      toast.error("Save failed: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!existing) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-slate-700">Contract not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/history")}>Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/preview/${existing.id}`)}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Contract</h1>
            <p className="text-slate-500">{existing.contractNumber}</p>
          </div>
        </div>

        {/* Buyer */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Buyer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Full Name *</Label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="mt-1" /></div>
              <div><Label>ID Number *</Label><Input value={buyerId} onChange={(e) => setBuyerId(e.target.value)} className="mt-1" /></div>
              <div><Label>Mobile *</Label><Input value={buyerMobile} onChange={(e) => setBuyerMobile(e.target.value)} className="mt-1" /></div>
              <div><Label>Business Name *</Label><Input value={buyerBusinessName} onChange={(e) => setBuyerBusinessName(e.target.value)} className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Equipment</CardTitle>
              <Badge variant="secondary">{equipments.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {equipments.map((eq, idx) => (
                <motion.div key={eq.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <Card className="border-amber-200">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Equipment #{idx + 1}</span>
                        {equipments.length > 1 && <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeEq(idx)}><Trash2 className="w-4 h-4" /></Button>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4 space-y-4">
                      <div><Label>Name *</Label><Input value={eq.name} onChange={(e) => updateEq(idx, "name", e.target.value)} className="mt-1" /></div>
                      <div><Label>Description</Label><Textarea value={eq.description} onChange={(e) => updateEq(idx, "description", e.target.value)} className="mt-1 min-h-[100px]" /></div>
                      <div>
                        <Label>Picture</Label>
                        <div className="mt-1">
                          {eq.imageData ? (
                            <div className="relative w-fit">
                              <img src={eq.imageData} alt="" className="w-48 h-48 object-cover rounded-lg border" />
                              <button onClick={() => updateEq(idx, "imageData", "")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50">
                              <Upload className="w-8 h-8 text-slate-400" /><span className="text-sm text-slate-500 mt-2">Click to upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(idx, f); }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><Label>Buying Price (KES)</Label><Input type="number" value={eq.buyingPrice || ""} onChange={(e) => updateEq(idx, "buyingPrice", Number(e.target.value) || 0)} className="mt-1" /></div>
                        <div><Label>Shipping Fee (KES)</Label><Input type="number" value={eq.shippingFee || ""} onChange={(e) => updateEq(idx, "shippingFee", Number(e.target.value) || 0)} className="mt-1" /></div>
                        <div><Label>Importer Fee (KES)</Label><Input type="number" value={eq.importerFee || ""} onChange={(e) => updateEq(idx, "importerFee", Number(e.target.value) || 0)} className="mt-1" /></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button variant="outline" className="w-full border-dashed" onClick={addEq}><Plus className="w-4 h-4 mr-2" />Add Equipment</Button>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowPay(!showPay)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Payment Terms</CardTitle>
              {showPay ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {showPay && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Equipment</p><p className="text-lg font-bold">{equipments.length}</p></div>
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Buying Price</p><p className="text-lg font-bold">KES {totalBP.toLocaleString()}</p></div>
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Shipping</p><p className="text-lg font-bold">KES {totalShipping.toLocaleString()}</p></div>
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Importer Fee</p><p className="text-lg font-bold">KES {totalImporterFee.toLocaleString()}</p></div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex justify-between">
                    <span className="font-semibold text-amber-900">Grand Total</span>
                    <span className="text-xl font-bold text-amber-900">KES {grandTotal.toLocaleString()}</span>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Upfront (BP + Importer Fee):</span><span className="font-medium">KES {upfrontPayment.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Balance (Shipping):</span><span className="font-medium">KES {totalShipping.toLocaleString()}</span></div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-white/80 backdrop-blur p-4 rounded-lg border shadow-lg">
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/preview/${existing.id}`)}>Cancel</Button>
          <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={saving}>
            {saving ? <span className="animate-pulse">Saving...</span> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </div>
      <Toaster position="top-right" />
    </Layout>
  );
}
