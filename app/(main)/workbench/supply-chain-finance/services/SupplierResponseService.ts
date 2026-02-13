import { supabase } from "../lib/supabase";

export interface SupplierResponse {
  id: string;
  signal_id: string;
  response_date: string;
  response_type: string;
  proposed_date: string | null;
  message: string | null;
  contact_person: string | null;
  created_at: string;
}

export const SupplierResponseService = {
  async getResponses(signalId: string): Promise<SupplierResponse[]> {
    const { data, error } = await supabase
      .from("supplier_responses")
      .select("*")
      .eq("signal_id", signalId)
      .order("response_date", { ascending: false });

    if (error) {
      console.error("Error fetching supplier responses:", error);
      throw error;
    }

    return data || [];
  },

  async addResponse(response: Omit<SupplierResponse, "id" | "created_at">): Promise<void> {
    const { error } = await supabase.from("supplier_responses").insert(response);

    if (error) {
      console.error("Error adding supplier response:", error);
      throw error;
    }
  },
};
