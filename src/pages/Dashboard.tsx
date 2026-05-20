import { Link, useNavigate } from "react-router";
import { Layout } from "@/components/Layout";
import { listContracts, calcTotals } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign, Clock, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}><Icon className="w-5 h-5 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [delId, setDelId] = useState<string | null>(null);
  const contracts = listContracts();

  const total = contracts.length;
  const thisMonth = contracts.filter((c) => {
    const d = new Date(c.createdAt);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const revenue = contracts.reduce((s, c) => s + calcTotals(c.equipments).grandTotal, 0);
  const pending = contracts.filter((c) => c.status === "draft").length;

  const handleDelete = () => {
    if (delId) {
      const all = listContracts();
      localStorage.setItem("kira_contracts", JSON.stringify(all.filter((c) => c.id !== delId)));
      setDelId(null);
      window.location.reload();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of your contract management</p>
          </div>
          <Link to="/new">
            <Button className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Create New Contract</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Contracts" value={String(total)} icon={FileText} color="bg-blue-600" />
          <StatCard title="This Month" value={String(thisMonth)} icon={Calendar} color="bg-emerald-600" />
          <StatCard title="Total Revenue" value={`KES ${revenue.toLocaleString()}`} icon={DollarSign} color="bg-amber-600" />
          <StatCard title="Pending" value={String(pending)} icon={Clock} color="bg-red-500" />
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Contracts</CardTitle></CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No contracts yet. Create your first contract!</p>
                <Link to="/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Create Contract</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead><TableHead>Buyer</TableHead><TableHead>Date</TableHead>
                    <TableHead>Equipment</TableHead><TableHead>Total (KES)</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.slice(0, 5).map((c) => {
                    const t = calcTotals(c.equipments);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contractNumber}</TableCell>
                        <TableCell>{c.buyerName}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!delId} onOpenChange={() => setDelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
