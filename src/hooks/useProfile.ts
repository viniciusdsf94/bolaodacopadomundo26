import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const { data, error } = response;

        if (error) {
          setError(error.message);
          setProfile(null);
        } else {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar perfil");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
};
