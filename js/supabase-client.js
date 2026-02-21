// ─────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE SUPABASE
// ─────────────────────────────────────────────────────────

const SUPABASE_URL = "https://eyyeeailtzxzemokldmj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eWVlYWlsdHp4emVtb2tsZG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTYyMzgsImV4cCI6MjA4NzI3MjIzOH0.3sH47_Uekyjs41DdL3fYuxxGb5nTXyyYUSmqPrIuQxI";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
