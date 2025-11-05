import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  investment_id: z.string().optional(),
  asset_type: z.enum(["Equity", "Commodity", "Bonds", "Real Estate", "Mutual Funds"]),
  country: z.enum(["India", "US"]),
  name: z.string().min(1, "Name is required"),
  transaction_type: z.enum(["buy", "sell"]),
  transaction_date: z.string().min(1, "Date is required"),
  price: z.string().min(1, "Price is required"),
  quantity: z.string().min(1, "Quantity is required"),
  misc_costs: z.string().default("0"),
  broker_fee_percent: z.string().default("5"),
  tax_percent: z.string().default("0"),
  notes: z.string().optional(),
});

const TransactionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const investmentId = searchParams.get("investmentId");
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      investment_id: investmentId || "",
      transaction_type: "buy",
      transaction_date: new Date().toISOString().split("T")[0],
      misc_costs: "0",
      broker_fee_percent: "5",
      tax_percent: "0",
    },
  });

  useEffect(() => {
    fetchInvestments();
    if (investmentId) {
      fetchInvestmentDetails(investmentId);
    }
  }, [investmentId]);

  const fetchInvestments = async () => {
    const { data } = await supabase.from("investments").select("*").order("name");
    setInvestments(data || []);
  };

  const fetchInvestmentDetails = async (id: string) => {
    const { data } = await supabase.from("investments").select("*").eq("id", id).single();
    if (data) {
      form.setValue("asset_type", data.asset_type as "Equity" | "Commodity" | "Bonds" | "Real Estate" | "Mutual Funds");
      form.setValue("country", data.country as "India" | "US");
      form.setValue("name", data.name);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let finalInvestmentId = values.investment_id;

      if (!finalInvestmentId) {
        const { data: newInvestment, error: invError } = await supabase
          .from("investments")
          .insert({
            user_id: user.id,
            asset_type: values.asset_type,
            country: values.country,
            name: values.name,
          })
          .select()
          .single();

        if (invError) throw invError;
        finalInvestmentId = newInvestment.id;
      }

      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        investment_id: finalInvestmentId,
        transaction_type: values.transaction_type,
        transaction_date: values.transaction_date,
        price: parseFloat(values.price),
        quantity: parseFloat(values.quantity),
        misc_costs: parseFloat(values.misc_costs),
        broker_fee_percent: parseFloat(values.broker_fee_percent),
        tax_percent: parseFloat(values.tax_percent),
        notes: values.notes,
      });

      if (txError) throw txError;

      toast.success("Transaction added successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to add transaction: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="investment_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Existing Investment (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select or create new" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Create New Investment</SelectItem>
                          {investments.map((inv) => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {inv.name} ({inv.asset_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!form.watch("investment_id") && (
                  <>
                    <FormField
                      control={form.control}
                      name="asset_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Equity">Equity</SelectItem>
                              <SelectItem value="Commodity">Commodity</SelectItem>
                              <SelectItem value="Bonds">Bonds</SelectItem>
                              <SelectItem value="Real Estate">Real Estate</SelectItem>
                              <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="India">India</SelectItem>
                              <SelectItem value="US">US</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Reliance Industries, Gold, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transaction_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="misc_costs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Misc. Costs (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="broker_fee_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Broker Fee (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Adding..." : "Add Transaction"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/")} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TransactionForm;
