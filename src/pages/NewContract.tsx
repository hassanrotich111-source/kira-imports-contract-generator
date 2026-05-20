import { useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Upload, FileText, ChevronDown, ChevronUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { createContract, getSettings, calcTotals } from "@/lib/storage";
import { fileToBase64 } from "@/lib/storage";
import type { Equipment } from "@/lib/storage";
import { generateContractPdf, downloadPdf } from "@/lib/pdfGenerator";

const emptyEq: Equipment = {
  id: "", name: "", description: "", imageData: "",
  buyingPrice: 0, shippingFee: 0, importerFee: 0, quantity: 1,
};

export default function NewContract() {
  const navigate = useNavigate();
  const settings = getSettings();

  const [buyerName, setBuyerName] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [buyerMobile, setBuyerMobile] = useState("");
  const [buyerBusinessName, setBuyerBusinessName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(settings.defaultPaymentMethod);
  const [equipments, setEquipments] = useState<Equipment[]>([{ ...emptyEq, id: crypto.randomUUID() }]);
  const [showImp, setShowImp] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { totalBP, totalShipping, totalImporterFee, grandTotal, upfrontPayment } = calcTotals(equipments);

  const addEq = () => setEquipments([...equipments, { ...emptyEq, id: crypto.randomUUID() }]);
  const removeEq = (idx: number) => { if (equipments.length > 1) setEquipments(equipments.filter((_, i) => i !== idx)); };
  const updateEq = (idx: number, field: keyof Equipment, value: unknown) => {
    const u = [...equipments]; u[idx] = { ...u[idx], [field]: value }; setEquipments(u);
  };

  const handleImage = async (idx: number, file: File) => {
    const base64 = await fileToBase64(file);
    updateEq(idx, "imageData", base64);
  };

  const validate = () => {
    if (!buyerName.trim()) { toast.error("Buyer name is required"); return false; }
    if (!buyerId.trim()) { toast.error("Buyer ID is required"); return false; }
    if (!buyerMobile.trim()) { toast.error("Buyer mobile is required"); return false; }
    if (!buyerBusinessName.trim()) { toast.error("Business name is required"); return false; }
    const valid = equipments.filter((e) => e.name.trim());
    if (valid.length === 0) { toast.error("Add at least one equipment"); return false; }
    return true;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setGenerating(true);
    try {
      const validEqs = equipments.filter((e) => e.name.trim());
      const contract = createContract({
        buyerName, buyerId, buyerMobile, buyerBusinessName,
        paymentMethod, equipments: validEqs,
      });

      const pdfBytes = await generateContractPdf(contract, settings);
      downloadPdf(pdfBytes, `${contract.contractNumber}.pdf`);

      toast.success("Contract generated and downloaded!");
      navigate(`/preview/${contract.id}`);
    } catch (err) {
      toast.error("Failed to generate PDF: " + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    createContract({ buyerName, buyerId, buyerMobile, buyerBusinessName, paymentMethod, equipments });
    toast.success("Draft saved!");
    navigate("/");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Contract</h1>
          <p className="text-slate-500 mt-1">Fill in the details to generate a new importation contract</p>
        </div>

        {/* Importer */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowImp(!showImp)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Importer Details</CardTitle>
              {showImp ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {showImp && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Name</Label><Input value={settings.importerName} disabled className="bg-slate-50" /></div>
                    <div><Label>ID Number</Label><Input value={settings.importerId} disabled className="bg-slate-50" /></div>
                    <div><Label>Mobile</Label><Input value={settings.importerMobile} disabled className="bg-slate-50" /></div>
                    <div><Label>Business</Label><Input value={settings.importerBusinessName} disabled className="bg-slate-50" /></div>
                  </div>
                  <p className="text-xs text-slate-400">Edit these in Settings page</p>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Buyer */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Buyer / Customer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Full Name <span className="text-red-500">*</span></Label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="e.g. Kavisu Arnold Mutuku" className="mt-1" /></div>
              <div><Label>ID Number <span className="text-red-500">*</span></Label><Input value={buyerId} onChange={(e) => setBuyerId(e.target.value)} placeholder="e.g. 36051620" className="mt-1" /></div>
              <div><Label>Mobile Number <span className="text-red-500">*</span></Label><Input value={buyerMobile} onChange={(e) => setBuyerMobile(e.target.value)} placeholder="e.g. 0724919205" className="mt-1" /></div>
              <div><Label>Business Name <span className="text-red-500">*</span></Label><Input value={buyerBusinessName} onChange={(e) => setBuyerBusinessName(e.target.value)} placeholder="e.g. Jokika Engineering LTD" className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Equipment</CardTitle>
              <Badge variant="secondary">{equipments.filter((e) => e.name.trim()).length} added</Badge>
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
                      <div><Label>Equipment Name <span className="text-red-500">*</span></Label><Input value={eq.name} onChange={(e) => updateEq(idx, "name", e.target.value)} placeholder="e.g. NAIL MAKING MACHINE" className="mt-1" /></div>
                      <div><Label>Description (one bullet per line)</Label><Textarea value={eq.description} onChange={(e) => updateEq(idx, "description", e.target.value)} placeholder={`Quantity: 1\nMotor: 4.0kw\nWeight: 1900kg`} className="mt-1 min-h-[100px]" /></div>
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
                              <Upload className="w-8 h-8 text-slate-400" />
                              <span className="text-sm text-slate-500 mt-2">Click to upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(idx, f); }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><Label>Buying Price (KES)</Label><Input type="number" value={eq.buyingPrice || ""} onChange={(e) => updateEq(idx, "buyingPrice", Number(e.target.value) || 0)} placeholder="0" className="mt-1" /></div>
                        <div><Label>Shipping Fee (KES)</Label><Input type="number" value={eq.shippingFee || ""} onChange={(e) => updateEq(idx, "shippingFee", Number(e.target.value) || 0)} placeholder="0" className="mt-1" /></div>
                        <div><Label>Importer Fee (KES)</Label><Input type="number" value={eq.importerFee || ""} onChange={(e) => updateEq(idx, "importerFee", Number(e.target.value) || 0)} placeholder="0" className="mt-1" /></div>
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
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Equipment</p><p className="text-lg font-bold">{equipments.filter((e) => e.name.trim()).length}</p></div>
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Buying Price</p><p className="text-lg font-bold">KES {totalBP.toLocaleString()}</p></div>
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Shipping</p><p className="text-lg font-bold">KES {totalShipping.toLocaleString()}</p></div>
                    <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-500">Importer Fee</p><p className="text-lg font-bold">KES {totalImporterFee.toLocaleString()}</p></div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span className="font-semibold text-amber-900">Grand Total</span>
                    <span className="text-xl font-bold text-amber-900">KES {grandTotal.toLocaleString()}</span>
                  </div>
                  <div><Label>Payment Method</Label>
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
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Upfront (BP + Importer Fee):</span><span className="font-medium">KES {upfrontPayment.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Balance (Shipping):</span><span className="font-medium">KES {totalShipping.toLocaleString()}</span></div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-white/80 backdrop-blur p-4 rounded-lg border shadow-lg">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>Cancel</Button>
          <Button variant="outline" className="flex-1" onClick={handleSaveDraft}>Save Draft</Button>
          <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleGenerate} disabled={generating}>
            {generating ? <span className="animate-pulse">Generating...</span> : <><FileText className="w-4 h-4 mr-2" />Generate Contract</>}
          </Button>
        </div>
      </div>
      <Toaster position="top-right" />
    </Layout>
  );
}
