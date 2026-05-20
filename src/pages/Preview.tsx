import { useParams, useNavigate } from "react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, Pencil, ArrowLeft, FileText, User, Package, CreditCard } from "lucide-react";
import { Toaster, toast } from "sonner";
import { getContract, getSettings, calcTotals } from "@/lib/storage";
import { generateContractPdf, downloadPdf } from "@/lib/pdfGenerator";
import { useState, useEffect } from "react";

export default function Preview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contract = getContract(id || "");
  const settings = getSettings();
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (contract) generatePreview();
  }, [id]);

  const generatePreview = async () => {
    if (!contract) return;
    setGenerating(true);
    try {
      const bytes = await generateContractPdf(contract, settings);
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      toast.error("Failed to generate preview");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!contract) return;
    setGenerating(true);
    try {
      const bytes = await generateContractPdf(contract, settings);
      downloadPdf(bytes, `${contract.contractNumber}.pdf`);
      toast.success("PDF downloaded!");
    } catch (e) {
      toast.error("Download failed");
    } finally {
      setGenerating(false);
    }
  };

  if (!contract) {
    return (
      <Layout>
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Contract not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/history")}>Back to History</Button>
        </div>
      </Layout>
    );
  }

  const t = calcTotals(contract.equipments);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/history")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{contract.contractNumber}</h1>
              <p className="text-slate-500">{contract.buyerName} &mdash; {new Date(contract.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={generating}><Download className="w-4 h-4 mr-2" />{generating ? "..." : "Download"}</Button>
            <Button variant="outline" onClick={() => { if (pdfUrl) { const w = window.open(pdfUrl); if (w) setTimeout(() => w.print(), 500); } }}><Printer className="w-4 h-4 mr-2" />Print</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => navigate(`/edit/${contract.id}`)}><Pencil className="w-4 h-4 mr-2" />Edit</Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={contract.status === "generated" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            {contract.status === "generated" ? "Generated" : "Draft"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[800px]">
              <CardContent className="p-0 h-full">
                {pdfUrl ? (
                  <iframe src={pdfUrl} className="w-full h-full rounded-lg" title="Contract PDF" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    {generating ? "Generating preview..." : "Click Generate to preview"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-amber-600" /> Buyer</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{contract.buyerName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">ID</span><span>{contract.buyerId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Mobile</span><span>{contract.buyerMobile}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Business</span><span>{contract.buyerBusinessName}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4 text-amber-600" /> Equipment ({contract.equipments.length})</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3">
                {contract.equipments.map((eq) => (
                  <div key={eq.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                    {eq.imageData && <img src={eq.imageData} alt="" className="w-12 h-12 object-cover rounded" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{eq.name}</p>
                      <p className="text-xs text-slate-500">BP: KES {(eq.buyingPrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-600" /> Payment</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Buying Price</span><span>KES {t.totalBP.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>KES {t.totalShipping.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Importer Fee</span><span>KES {t.totalImporterFee.toLocaleString()}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Grand Total</span><span>KES {t.grandTotal.toLocaleString()}</span></div>
                <div className="text-xs text-slate-500 mt-2">Method: {contract.paymentMethod}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </Layout>
  );
}
