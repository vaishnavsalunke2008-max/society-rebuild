const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const spec = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const json = await spec.json();
  console.log(Object.keys(json));
  if (json.definitions) console.log(Object.keys(json.definitions));
  if (json.paths) console.log("Has paths");
}
run();
