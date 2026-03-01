import { supabase } from "./supabase";

export const settingsService = {
  async getMaintenanceMode(): Promise<boolean> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single();
    return data?.value === "true";
  },

  async getMaintenanceTitle(): Promise<string> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_title")
      .single();
    return data?.value || "ОЧАКВАЙТЕ СКОРО!";
  },

  async getMaintenanceMessage(): Promise<string> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_message")
      .single();
    return data?.value || "Our website is under maintenance. We'll be back soon!";
  },

  async getMaintenanceEndTime(): Promise<string | null> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_end_time")
      .single();
    return data?.value || null;
  },

  async getMaintenanceBgUrl(): Promise<string> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_bg_url")
      .single();
    return data?.value || "/Maintance/1.jpeg";
  },

  async getMaintenanceLogoUrl(): Promise<string> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_logo_url")
      .single();
    return data?.value || "/Maintance/LOGO.png";
  }
};
