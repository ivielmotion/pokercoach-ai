import { createClient } from '@supabase/supabase-js';

// Configuración para el proyecto de DataPacks
export const supabaseDatapacks = createClient(
  'https://mbaypqtuiziilmjcoprh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iYXlwcXR1aXppaWxtamNvcHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzM4NTMsImV4cCI6MjA5OTIwOTg1M30.L0y-McwdqryF6hR2oWtBoaTct6Hnc8rknILO7T_qqGU'
);

// Configuración para el proyecto de Ranges
export const supabaseRanges = createClient(
  'https://adhqicolbufktfzzpbzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkaHFpY29sYnVma3RmenpwYnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzMyNjQsImV4cCI6MjA5OTIwOTI2NH0.cP64H7VxmoSx-ByXupki_MdiGTzI8fLJPtCPAnBB_Ro'
);
