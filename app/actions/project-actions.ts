'use server';

// import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import type { ProjectInsert, ProjectUpdate, ProjectRow } from '../../lib/types/database';
import { z } from 'zod';

// ============================================================================
// CONSTRUCTORA WM/M&S - SERVER ACTIONS CRUD PROYECTOS (Supabase)
// "CONSTRUYENDO EL FUTURO"
//
// Mutaciones seguras ejecutadas en el servidor. Revalidan la ruta tras cada
// operación para que los Server Components refresquen los datos.
// ============================================================================

const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, 'El código es obligatorio').max(20),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  client_name: z.string().min(1, 'El cliente es obligatorio').max(200),
  client_phone: z.string().max(30).optional().nullable(),
  client_email: z.string().email('Email inválido').optional().nullable(),
  location: z.string().min(1, 'La ubicación es obligatoria').max(300),
  typology: z.enum(['residential', 'commercial', 'industrial', 'civil', 'public']),
  area_m2: z.number().nonnegative(),
  quality_level: z.enum(['basic', 'moderate', 'premium']),
  status: z.enum(['planning', 'execution', 'paused', 'completed']),
  start_date: z.string().optional().nullable(),
  estimated_end_date: z.string().optional().nullable(),
  duration_days: z.number().int().nonnegative(),
  total_budget: z.number().nonnegative(),
  budget_total: z.number().optional().nullable(),
  calculated_duration: z.number().int().optional().nullable(),
});

/**
 * Crea un proyecto en Supabase desde el servidor.
 */
export async function createProject(input: unknown): Promise<{ data: ProjectRow | null; error: string | null }> {
  try {
    const parsed = ProjectSchema.parse(input);
    const supabase = await createSupabaseServerClient();

    const payload: ProjectInsert = {
      id: parsed.id ?? crypto.randomUUID(),
      code: parsed.code,
      name: parsed.name,
      client_name: parsed.client_name,
      client_phone: parsed.client_phone ?? null,
      client_email: parsed.client_email ?? null,
      location: parsed.location,
      typology: parsed.typology,
      area_m2: parsed.area_m2,
      quality_level: parsed.quality_level,
      status: parsed.status,
      start_date: parsed.start_date ?? null,
      estimated_end_date: parsed.estimated_end_date ?? null,
      duration_days: parsed.duration_days,
      total_budget: parsed.total_budget,
      budget_total: parsed.budget_total ?? null,
      calculated_duration: parsed.calculated_duration ?? null,
      sync_status: 'synced',
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // revalidatePath('/');
    return { data: data as ProjectRow, error: null };
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.issues.map(e => e.message).join(', ')
      : err instanceof Error ? err.message : 'Error al crear el proyecto';
    return { data: null, error: message };
  }
}

/**
 * Actualiza un proyecto existente en Supabase desde el servidor.
 */
export async function updateProject(id: string, input: unknown): Promise<{ data: ProjectRow | null; error: string | null }> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { data: null, error: 'ID de proyecto inválido' };
    }

    const parsed = ProjectSchema.partial().parse(input);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('projects')
      .update(parsed as ProjectUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // revalidatePath('/');
    return { data: data as ProjectRow, error: null };
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.issues.map(e => e.message).join(', ')
      : err instanceof Error ? err.message : 'Error al actualizar el proyecto';
    return { data: null, error: message };
  }
}

/**
 * Elimina un proyecto en Supabase desde el servidor (CASCADE en BD).
 */
export async function deleteProject(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: 'ID de proyecto inválido' };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // revalidatePath('/');
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar el proyecto';
    return { success: false, error: message };
  }
}

/**
 * Lee un proyecto por ID desde el servidor (para rutas dinámicas [id]).
 */
export async function getProjectById(id: string): Promise<{ data: ProjectRow | null; error: string | null }> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { data: null, error: 'ID de proyecto inválido' };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('projects')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ProjectRow, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener el proyecto';
    return { data: null, error: message };
  }
}