const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env file
const envPath = './.env';
const dotenvContent = fs.readFileSync(envPath, 'utf8');
const env = {};
dotenvContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'temp_stats_reader@example.com';
  const password = 'SuperSecretPassword123!';

  console.log("Signing in to get the access token...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (authError) {
    console.error("Sign in failed:", authError.message);
    return;
  }

  const accessToken = authData.session.access_token;
  console.log("Logged in! User ID:", authData.user.id);

  console.log("Sending DELETE request to self-delete user account...");
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log("Successfully deleted the temporary user!");
      const resText = await response.text();
      console.log("Response:", resText);
    } else {
      const errText = await response.text();
      console.error(`Failed to delete user. Status: ${response.status}. Error:`, errText);
    }
  } catch (err) {
    console.error("Network or execution error:", err);
  }
}

run();
