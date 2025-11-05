import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Plus, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Investment {
  id: string;
  name: string;
  asset_type: string;
  country: string;
  totalValue: number;
  totalProfit: number;
  totalQuantity: number;
}

interface InvestmentListProps {
  investments: Investment[];
  assetType: string;
}

export const InvestmentList = ({ investments, assetType }: InvestmentListProps) => {
  const navigate = useNavigate();

  if (investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{assetType}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No {assetType.toLowerCase()} investments yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assetType}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {investments.map((investment) => {
          const isProfitable = investment.totalProfit >= 0;
          return (
            <div key={investment.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{investment.name}</h3>
                  <Badge variant="outline">{investment.country}</Badge>
                </div>
                <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                  <span>Qty: {investment.totalQuantity}</span>
                  <span>Value: ₹{investment.totalValue.toLocaleString()}</span>
                  <span className={isProfitable ? "text-success" : "text-destructive"}>
                    P/L: {isProfitable ? "+" : ""}₹{investment.totalProfit.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/investment/${investment.id}`)}>
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>
                <Button size="sm" onClick={() => navigate(`/transaction/new?investmentId=${investment.id}`)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Trade
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
