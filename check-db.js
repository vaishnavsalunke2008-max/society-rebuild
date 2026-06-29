const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Checking DB messages structure...");
  const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/messages?limit=1', {
    headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.json());
}
run();
