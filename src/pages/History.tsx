import { useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Pencil, Trash2, Search, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listContracts, calcTotals } from "@/lib/storage";
import { Toaster, toast } from "sonner";

export default function History() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [delId, setDelId] = useState<string | null>(null);
  const contracts = listContracts(search);

  const handleDelete = (id: string) => {
    const all = listContracts();
    localStorage.setItem("kira_contracts", JSON.stringify(all.filter((c) => c.id !== id)));
    setDelId(null);
    toast.success("Contract deleted");
    window.location.reload();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contract History</h1>
          <p className="text-slate-500 mt-1">{contracts.length} contract{contracts.length !== 1 ? "s" : ""} found</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by buyer name or contract number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardContent className="p-0">
            {contracts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">{search ? "No matches" : "No contracts yet"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract #</TableHead><TableHead>Buyer</TableHead><TableHead>Business</TableHead>
                      <TableHead>Date</TableHead><TableHead>Equipment</TableHead><TableHead>Total (KES)</TableHead>
                      <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c) => {
                      const t = calcTotals(c.equipments);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.contractNumber}</TableCell>
                          <TableCell>{c.buyerName}</TableCell>
                          <TableCell>{c.buyerBusinessName}</TableCell>
                          <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{c.equipments.length}</TableCell>
                          <TableCell>KES {t.grandTotal.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={c.status === "generated" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                              {c.status === "generated" ? "Generated" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/preview/${c.id}`)}><Eye className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/edit/${c.id}`)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDelId(c.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!delId} onOpenChange={() => setDelId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Contract</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => delId && handleDelete(delId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" />
    </Layout>
  );
}
