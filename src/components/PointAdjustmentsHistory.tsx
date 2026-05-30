import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History } from "lucide-react";
import { formatDateBR } from "@/lib/formatDate";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PointAdjustmentsHistory() {
  const { data: history = [] } = useQuery({
    queryKey: ["point_adjustments"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("point_adjustments")
        .select(`
          id, points, justification, created_at,
          user:profiles!point_adjustments_user_id_fkey(first_name, last_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (history.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="adjustments" className="border-border rounded-lg bg-card px-4 border">
        <AccordionTrigger className="hover:no-underline font-display font-bold py-4 text-sm">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> 
            Histórico de Ajustes Manuais
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2 pb-4">
            {history.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div>
                  <p className="font-medium text-sm">
                    {item.user?.first_name} {item.user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.justification}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDateBR(item.created_at.split('T')[0])}
                  </p>
                </div>
                <div className={`font-bold font-display ${item.points > 0 ? "text-primary" : "text-destructive"}`}>
                  {item.points > 0 ? "+" : ""}{item.points} pts
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
