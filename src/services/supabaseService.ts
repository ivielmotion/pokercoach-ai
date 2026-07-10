import { supabaseDatapacks, supabaseRanges } from './supabase';

// ============ DATAPACKS (Proyecto datapacks) ============

export interface DataPack {
  id: string;
  name: string;
  description: string;
  type: 'codex' | 'glossary' | 'strategy' | 'custom';
  source_type?: string;
  study_guide?: any;
  study_plan?: any;
  concept_map?: any;
  coverage_matrix?: any;
  concepts: any[];
  multiple_choice_questions?: any[];
  path_questions: any[];
  true_false_questions: any[];
  relationships?: any[];
  metadata?: any;
  raw_content?: string;
  system_prompt?: string;
  created_at: string;
}

export async function getAllDataPacks(): Promise<DataPack[]> {
  const { data, error } = await supabaseDatapacks
    .from('datapacks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching datapacks:', error);
    return [];
  }
  return data || [];
}

export async function getDataPackById(id: string): Promise<DataPack | null> {
  const { data, error } = await supabaseDatapacks
    .from('datapacks')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching datapack:', error);
    return null;
  }
  return data;
}

export async function createDataPack(pack: Omit<DataPack, 'id' | 'created_at'>): Promise<DataPack | null> {
  const { data, error } = await supabaseDatapacks
    .from('datapacks')
    .insert(pack)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating datapack:', error);
    return null;
  }
  return data;
}

export async function updateDataPack(id: string, updates: Partial<DataPack>): Promise<DataPack | null> {
  const { data, error } = await supabaseDatapacks
    .from('datapacks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating datapack:', error);
    return null;
  }
  return data;
}

export async function deleteDataPack(id: string): Promise<boolean> {
  const { error } = await supabaseDatapacks
    .from('datapacks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting datapack:', error);
    return false;
  }
  return true;
}

// ============ USER PROGRESS (Proyecto datapacks) ============

export interface UserProgress {
  id: string;
  datapack_id: string;
  score: number;
  concept_mastery: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function getUserProgress(datapackId: string): Promise<UserProgress | null> {
  const { data, error } = await supabaseDatapacks
    .from('user_progress')
    .select('*')
    .eq('datapack_id', datapackId)
    .single();
  
  if (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
  return data;
}

export async function saveUserProgress(datapackId: string, score: number, conceptMastery: Record<string, any>): Promise<UserProgress | null> {
  const { data, error } = await supabaseDatapacks
    .from('user_progress')
    .upsert({
      datapack_id: datapackId,
      score,
      concept_mastery: conceptMastery,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving user progress:', error);
    return null;
  }
  return data;
}

// ============ HUD PROFILES (Proyecto ranges) ============

export interface HUDProfile {
  id: string;
  name: string;
  description?: string;
  lines: any[];
  created_at: string;
  updated_at: string;
}

export async function getAllHUDProfiles(): Promise<HUDProfile[]> {
  const { data, error } = await supabaseRanges
    .from('hud_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching HUD profiles:', error);
    return [];
  }
  return data || [];
}

export async function createHUDProfile(profile: Omit<HUDProfile, 'id' | 'created_at' | 'updated_at'>): Promise<HUDProfile | null> {
  const { data, error } = await supabaseRanges
    .from('hud_profiles')
    .insert(profile)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating HUD profile:', error);
    return null;
  }
  return data;
}

export async function updateHUDProfile(id: string, updates: Partial<HUDProfile>): Promise<HUDProfile | null> {
  const { data, error } = await supabaseRanges
    .from('hud_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating HUD profile:', error);
    return null;
  }
  return data;
}

export async function deleteHUDProfile(id: string): Promise<boolean> {
  const { error } = await supabaseRanges
    .from('hud_profiles')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting HUD profile:', error);
    return false;
  }
  return true;
}

// ============ PREFLOP TABLES (Proyecto ranges) ============

export interface PreflopTable {
  id: string;
  position: string;
  open_raise: string[];
  open_raise_percentage: number;
  three_bet: string[];
  three_bet_percentage: number;
  call: string[];
  call_percentage: number;
  created_at: string;
  updated_at: string;
}

export async function getAllPreflopTables(): Promise<PreflopTable[]> {
  const { data, error } = await supabaseRanges
    .from('preflop_tables')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching preflop tables:', error);
    return [];
  }
  return data || [];
}

export async function createPreflopTable(table: Omit<PreflopTable, 'id' | 'created_at' | 'updated_at'>): Promise<PreflopTable | null> {
  const { data, error } = await supabaseRanges
    .from('preflop_tables')
    .insert(table)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating preflop table:', error);
    return null;
  }
  return data;
}

export async function updatePreflopTable(id: string, updates: Partial<PreflopTable>): Promise<PreflopTable | null> {
  const { data, error } = await supabaseRanges
    .from('preflop_tables')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating preflop table:', error);
    return null;
  }
  return data;
}

export async function deletePreflopTable(id: string): Promise<boolean> {
  const { error } = await supabaseRanges
    .from('preflop_tables')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting preflop table:', error);
    return false;
  }
  return true;
}

// ============ POKER RANGES (Proyecto ranges) ============

export interface PokerRange {
  id: string;
  name: string;
  description?: string;
  hands: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function getAllPokerRanges(): Promise<PokerRange[]> {
  const { data, error } = await supabaseRanges
    .from('poker_ranges')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching poker ranges:', error);
    return [];
  }
  return data || [];
}

export async function createPokerRange(range: Omit<PokerRange, 'id' | 'created_at' | 'updated_at'>): Promise<PokerRange | null> {
  const { data, error } = await supabaseRanges
    .from('poker_ranges')
    .insert(range)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating poker range:', error);
    return null;
  }
  return data;
}

export async function updatePokerRange(id: string, updates: Partial<PokerRange>): Promise<PokerRange | null> {
  const { data, error } = await supabaseRanges
    .from('poker_ranges')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating poker range:', error);
    return null;
  }
  return data;
}

export async function deletePokerRange(id: string): Promise<boolean> {
  const { error } = await supabaseRanges
    .from('poker_ranges')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting poker range:', error);
    return false;
  }
  return true;
}

// ============ POKER SCENARIOS (Proyecto ranges) ============

export interface PokerScenario {
  id: string;
  title: string;
  position: string;
  action_before_hero: string;
  opponent_type?: string;
  range_id?: string;
  clue: string;
  created_at: string;
}

export async function getAllPokerScenarios(): Promise<PokerScenario[]> {
  const { data, error } = await supabaseRanges
    .from('poker_scenarios')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching poker scenarios:', error);
    return [];
  }
  return data || [];
}

export async function createPokerScenario(scenario: Omit<PokerScenario, 'id' | 'created_at'>): Promise<PokerScenario | null> {
  const { data, error } = await supabaseRanges
    .from('poker_scenarios')
    .insert(scenario)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating poker scenario:', error);
    return null;
  }
  return data;
}

export async function deletePokerScenario(id: string): Promise<boolean> {
  const { error } = await supabaseRanges
    .from('poker_scenarios')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting poker scenario:', error);
    return false;
  }
  return true;
}
