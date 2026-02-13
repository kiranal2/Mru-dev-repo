import { supabase, SavedView } from "../lib/supabase";

export const ViewsService = {
  async list(): Promise<SavedView[]> {
    const { data, error } = await supabase
      .from("saved_views")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(name: string, params: Record<string, any>): Promise<SavedView> {
    const { data, error } = await supabase
      .from("saved_views")
      .insert({
        name,
        params,
        created_by: "demo_user",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(viewId: string): Promise<void> {
    const { error } = await supabase.from("saved_views").delete().eq("view_id", viewId);

    if (error) throw error;
  },
};
