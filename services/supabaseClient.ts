import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spqcmbxfddippqexiire.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iPbFCJT2_ggsTmtMxri0Fw_d4-1MJNt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
