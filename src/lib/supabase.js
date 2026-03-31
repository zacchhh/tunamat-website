import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hhfexwrpsepoojekvcoz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZmV4d3Jwc2Vwb29qZWt2Y296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMzcxMTQsImV4cCI6MjA4OTgxMzExNH0.ZHOuL7uMS4ETppD1xV-0Gi3NBtYYf57PlJ7scvTfDOg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
