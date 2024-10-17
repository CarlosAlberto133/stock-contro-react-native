import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqehyojknqpwavslbfwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZWh5b2prbnFwd2F2c2xiZndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxMTcxNDMsImV4cCI6MjA0NDY5MzE0M30.OwlPY1s2EBjOaZp7-793avh6jPfwcBfOwL2KThmCxa0';

export const supabase = createClient(supabaseUrl, supabaseKey);