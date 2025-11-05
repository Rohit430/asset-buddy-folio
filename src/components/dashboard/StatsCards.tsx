import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";

interface StatsCardsProps {
  totalValue: number;
  totalProfit: number;
  totalInvestments: number;
}

export const StatsCards = ({ totalValue, totalProfit, totalInvestments }: StatsCardsProps) => {
  const profitPercentage = totalValue > 0 ? ((totalProfit / totalValue) * 100).toFixed(2) : "0.00";
  const isProfitable = totalProfit >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`border-l-4 ${isProfitable ? "border-l-success" : "border-l-destructive"}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total P/L</p>
              <p className={`text-2xl font-bold ${isProfitable ? "text-success" : "text-destructive"}`}>
                {isProfitable ? "+" : ""}₹{totalProfit.toLocaleString()}
              </p>
            </div>
            <div className={`rounded-full p-3 ${isProfitable ? "bg-success/10" : "bg-destructive/10"}`}>
              {isProfitable ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-accent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Returns</p>
              <p className={`text-2xl font-bold ${isProfitable ? "text-success" : "text-destructive"}`}>
                {isProfitable ? "+" : ""}
                {profitPercentage}%
              </p>
            </div>
            <div className="rounded-full bg-accent/10 p-3">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-chart-3">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Investments</p>
              <p className="text-2xl font-bold">{totalInvestments}</p>
            </div>
            <div className="rounded-full bg-chart-3/10 p-3">
              <PieChart className="h-5 w-5 text-chart-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
