const { createClient } = require("@supabase/supabase-js");
const { resolveServiceKey } = require("./supabase-key");

const url = process.env.SUPABASE_URL?.trim();
if (!url) {
  throw new Error("SUPABASE_URL is required for the API server");
}

const supabase = createClient(url, resolveServiceKey());

module.exports = supabase;
