// ─── Supabase Configuration ───────────────────────────────────────────────────
// Replace the two values below with your actual Supabase project credentials.
// Go to: Supabase Dashboard → Settings → API
//   SUPABASE_URL  → "Project URL"
//   SUPABASE_KEY  → "anon public" key

const SUPABASE_URL = 'https://yfkpttvytjasyikoncyy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3B0dHZ5dGphc3lpa29uY3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDA5NzMsImV4cCI6MjA5MDc3Njk3M30.-ir10ydBFDY-dsJ8YjwXI7YX2GP_SebS2A20WyUgbc4';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);