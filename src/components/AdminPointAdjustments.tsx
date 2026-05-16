import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateBR } from "@/lib/formatDate";

export default function AdminPointAdjustments() {
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["admin_users_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
  });

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

  const [selectedUserId, setSelectedUserId] = useState("");
  const [points, setPoints] = useState("");
  const [justification, setJustification] = useState("");

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreSubmit = () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário.");
      return;
    }
    const pts = parseInt(points);
    if (isNaN(pts) || pts === 0) {
      toast.error("Insira um valor válido de pontos (diferente de zero).");
      return;
    }
    if (!justification.trim()) {
      toast.error("A justificativa é obrigatória.");
      return;
    }
    setConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("point_adjustments").insert({
        user_id: selectedUserId,
        admin_id: userData.user.id,
        points: parseInt(points),
        justification: justification.trim(),
      });

      if (error) throw error;

      toast.success("Pontos ajustados com sucesso!");
      
      // Limpar formulário
      setSelectedUserId("");
      setPoints("");
      setJustification("");
      setConfirmDialog(false);

      // Atualizar queries
      queryClient.invalidateQueries({ queryKey: ["point_adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["historical_ranking"] });
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao ajustar pontos: " + (error.message || "Desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Formulário de Inserção */}
      <div className="rounded-xl border border-border bg-gradient-card p-4 space-y-4">
        <h3 className="font-display font-bold text-sm">Ajuste Manual de Pontos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Usuário</Label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione um usuário...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Pontos (use - para remover)</Label>
            <Input
              type="number"
              placeholder="Ex: 5 ou -3"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Justificativa</Label>
          <Input
            type="text"
            placeholder="Motivo do ajuste..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>

        <Button onClick={handlePreSubmit} className="w-full gap-1">
          <Plus className="h-4 w-4" /> Adicionar / Remover Pontos
        </Button>
      </div>

      {/* Histórico */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="font-display font-bold text-sm flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de Ajustes
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum ajuste registrado.</p>
        ) : (
          <div className="space-y-3">
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
        )}
      </div>

      {/* Modal de Confirmação */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ajuste de Pontos</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Você está prestes a aplicar o seguinte ajuste:</p>
              <div className="bg-secondary/50 p-3 rounded-md border border-border">
                <p><strong>Usuário:</strong> {selectedUser?.first_name} {selectedUser?.last_name}</p>
                <p><strong>Pontos:</strong> <span className={parseInt(points) > 0 ? "text-primary" : "text-destructive font-bold"}>{points > 0 ? "+" : ""}{points}</span></p>
                <p><strong>Motivo:</strong> {justification}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting} className="bg-accent">
              {isSubmitting ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
