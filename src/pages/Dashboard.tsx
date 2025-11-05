import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PortfolioChart } from "@/components/dashboard/PortfolioChart";
import { InvestmentList } from "@/components/investments/InvestmentList";
import { toast } from "sonner";

interface Investment {
  id: string;
  name: string;
  asset_type: string;
  country: string;
}

interface Transaction {
  id: string;
  investment_id: string;
  transaction_type: string;
  price: number;
  quantity: number;
  misc_costs: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: investmentsData, error: invError } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });

      if (invError) throw invError;

      const { data: transactionsData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (txError) throw txError;

      setInvestments(investmentsData || []);
      setTransactions(transactionsData || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateInvestmentMetrics = (investmentId: string) => {
    const invTransactions = transactions.filter((t) => t.investment_id === investmentId);
    let totalValue = 0;
    let totalProfit = 0;
    let totalQuantity = 0;

    invTransactions.forEach((tx) => {
      const amount = tx.price * tx.quantity;
      if (tx.transaction_type === "buy") {
        totalValue += amount + tx.misc_costs;
        totalQuantity += tx.quantity;
      } else {
        totalProfit += amount - tx.misc_costs;
        totalQuantity -= tx.quantity;
      }
    });

    totalProfit -= totalValue;

    return { totalValue, totalProfit, totalQuantity };
  };

  const portfolioData = investments.map((inv) => {
    const metrics = calculateInvestmentMetrics(inv.id);
    return {
      name: inv.asset_type,
      value: metrics.totalValue,
      profit: metrics.totalProfit,
    };
  });

  const aggregatedPortfolio = portfolioData.reduce((acc, curr) => {
    const existing = acc.find((item) => item.name === curr.name);
    if (existing) {
      existing.value += curr.value;
      existing.profit += curr.profit;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as typeof portfolioData);

  const totalValue = aggregatedPortfolio.reduce((sum, item) => sum + item.value, 0);
  const totalProfit = aggregatedPortfolio.reduce((sum, item) => sum + item.profit, 0);

  const assetTypes = ["Equity", "Commodity", "Bonds", "Real Estate", "Mutual Funds"];

  if (loading) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Portfolio Overview</h2>
          <Button onClick={() => navigate("/transaction/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </div>

        <StatsCards totalValue={totalValue} totalProfit={totalProfit} totalInvestments={investments.length} />

        <div className="grid gap-6 md:grid-cols-2">
          <PortfolioChart data={aggregatedPortfolio} />
          <div className="space-y-4">
            {assetTypes.map((assetType) => {
              const typeInvestments = investments
                .filter((inv) => inv.asset_type === assetType)
                .map((inv) => ({
                  ...inv,
                  ...calculateInvestmentMetrics(inv.id),
                }));
              return <InvestmentList key={assetType} investments={typeInvestments} assetType={assetType} />;
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
