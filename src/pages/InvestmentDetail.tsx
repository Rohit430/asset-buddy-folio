import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: inv, error: invError } = await supabase.from("investments").select("*").eq("id", id).single();

      if (invError) throw invError;

      const { data: txs, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("investment_id", id)
        .order("transaction_date", { ascending: false });

      if (txError) throw txError;

      setInvestment(inv);
      setTransactions(txs || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    let totalBuyValue = 0;
    let totalBuyQty = 0;
    let totalSellValue = 0;
    let totalSellQty = 0;

    transactions.forEach((tx) => {
      const totalAmount = tx.price * tx.quantity;
      if (tx.transaction_type === "buy") {
        totalBuyValue += totalAmount + tx.misc_costs;
        totalBuyQty += tx.quantity;
      } else {
        totalSellValue += totalAmount - tx.misc_costs;
        totalSellQty += tx.quantity;
      }
    });

    const currentQty = totalBuyQty - totalSellQty;
    const avgBuyPrice = totalBuyQty > 0 ? totalBuyValue / totalBuyQty : 0;
    const totalProfit = totalSellValue - totalBuyValue;

    return {
      currentQty,
      avgBuyPrice,
      totalBuyValue,
      totalSellValue,
      totalProfit,
    };
  };

  const calculateTransactionMetrics = (tx: any) => {
    const totalAmount = tx.price * tx.quantity;
    const brokerFee = (totalAmount * tx.broker_fee_percent) / 100;
    const taxAmount = (totalAmount * tx.tax_percent) / 100;
    const holdingPeriod = Math.floor((new Date().getTime() - new Date(tx.transaction_date).getTime()) / (1000 * 60 * 60 * 24));
    const termType = holdingPeriod > 365 ? "Long Term" : "Short Term";
    const financialYear = new Date(tx.transaction_date).getMonth() >= 3 ? `FY ${new Date(tx.transaction_date).getFullYear()}-${new Date(tx.transaction_date).getFullYear() + 1}` : `FY ${new Date(tx.transaction_date).getFullYear() - 1}-${new Date(tx.transaction_date).getFullYear()}`;

    let profit = 0;
    if (tx.transaction_type === "sell") {
      profit = totalAmount - tx.misc_costs - brokerFee - taxAmount;
    }

    return {
      totalAmount,
      brokerFee,
      taxAmount,
      holdingPeriod,
      termType,
      financialYear,
      profit,
      profitAfterTax: profit - taxAmount,
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!investment) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-muted-foreground">Investment not found</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const metrics = calculateMetrics();
  const isProfitable = metrics.totalProfit >= 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold">{investment.name}</h2>
              <div className="mt-1 flex gap-2">
                <Badge>{investment.asset_type}</Badge>
                <Badge variant="outline">{investment.country}</Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => navigate(`/transaction/new?investmentId=${id}`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Current Holdings</p>
              <p className="text-2xl font-bold">{metrics.currentQty.toFixed(4)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Avg. Buy Price</p>
              <p className="text-2xl font-bold">₹{metrics.avgBuyPrice.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">₹{metrics.totalBuyValue.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${isProfitable ? "border-l-success" : "border-l-destructive"}`}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total P/L</p>
              <p className={`text-2xl font-bold ${isProfitable ? "text-success" : "text-destructive"}`}>
                {isProfitable ? "+" : ""}₹{metrics.totalProfit.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground">No transactions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Misc. Costs</TableHead>
                    <TableHead className="text-right">Broker Fee</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Net P/L</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>FY</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const txMetrics = calculateTransactionMetrics(tx);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.transaction_date), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={tx.transaction_type === "buy" ? "default" : "secondary"}>
                            {tx.transaction_type === "buy" ? (
                              <TrendingUp className="mr-1 h-3 w-3" />
                            ) : (
                              <TrendingDown className="mr-1 h-3 w-3" />
                            )}
                            {tx.transaction_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{tx.quantity}</TableCell>
                        <TableCell className="text-right">₹{tx.price.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{txMetrics.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{tx.misc_costs.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          ₹{txMetrics.brokerFee.toFixed(2)} ({tx.broker_fee_percent}%)
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{txMetrics.taxAmount.toFixed(2)} ({tx.tax_percent}%)
                        </TableCell>
                        <TableCell className={`text-right ${tx.transaction_type === "sell" ? (txMetrics.profitAfterTax >= 0 ? "text-success" : "text-destructive") : ""}`}>
                          {tx.transaction_type === "sell" ? `₹${txMetrics.profitAfterTax.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{txMetrics.termType}</Badge>
                        </TableCell>
                        <TableCell>{txMetrics.financialYear}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InvestmentDetail;
