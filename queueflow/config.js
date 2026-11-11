// Supabase project configuration. The publishable key is designed for browser use.
// Never put a Supabase service_role key in this file.
window.QUEUEFLOW_CONFIG = {
  supabaseUrl: "https://psrhpwkcmjcjgtbwepdh.supabase.co",
  supabaseKey: "sb_publishable_n0bMAU73NVv2VZRAuhg8FA_BX8Q8ij7"
};
window.queueflowClient = window.supabase.createClient(
  window.QUEUEFLOW_CONFIG.supabaseUrl,
  window.QUEUEFLOW_CONFIG.supabaseKey
);