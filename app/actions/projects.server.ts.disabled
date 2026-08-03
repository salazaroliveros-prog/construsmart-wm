// ============================================================================
// SERVER ACTIONS FOR PROJECTS
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Server Actions para operaciones CRUD de proyectos.
// Estas acciones usan @supabase/server y incluyen user_id automáticamente
// para tenencia por auth.uid(). Las políticas RLS en el servidor aseguran
// que los usuarios solo puedan acceder a sus propios datos.
// ============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getServerUserId } from '@/lib/supabase/server';
import { LocalProject } from '@/lib/db/offlineStore';

export interface CreateProjectInput {
  code: string;
  name: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  location: string;
  typology: 'residential' | 'commercial' | 'industrial' | 'civil' | 'public';
  area_m2: number;
  quality_level: 'basic' | 'moderate' | 'premium';
  status: 'planning' | 'execution' | 'paused' | 'completed';
  start_date?: string;
  estimated_end_date?: string;
  duration_days: number;
  total_budget: number;
  budget_total?: number;
  calculated_duration?: number;
}

export interface UpdateProjectInput extends CreateProjectInput {
  id: string;
}

export interface ProjectResult {
  data?: LocalProject;
  error?: string;
}

/**
 * Crea un nuevo proyecto
 * Incluye automáticamente user_id para tenencia
 */
export async function createProject(input: CreateProjectInput): Promise<ProjectResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { error: 'Usuario no autenticado' };
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        ...input,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return { error: error.message };
    }

    revalidatePath('/projects');
    revalidatePath('/dashboard');

    return { data: data as LocalProject };
  } catch (error) {
    console.error('Error in createProject:', error);
    return { error: 'Error al crear el proyecto' };
  }
}

/**
 * Actualiza un proyecto existente
 * Verifica que el usuario sea el propietario del proyecto
 */
export async function updateProject(input: UpdateProjectInput): Promise<ProjectResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { error: 'Usuario no autenticado' };
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .eq('user_id', userId) // Solo puede actualizar sus propios proyectos
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return { error: error.message };
    }

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${input.id}`);

    return { data: data as LocalProject };
  } catch (error) {
    console.error('Error in updateProject:', error);
    return { error: 'Error al actualizar el proyecto' };
  }
}

/**
 * Elimina un proyecto
 * Verifica que el usuario sea el propietario del proyecto
 */
export async function deleteProject(id: string): Promise<{ error?: string }> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { error: 'Usuario no autenticado' };
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Solo puede eliminar sus propios proyectos

    if (error) {
      console.error('Error deleting project:', error);
      return { error: error.message };
    }

    revalidatePath('/projects');
    revalidatePath('/dashboard');

    return {};
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return { error: 'Error al eliminar el proyecto' };
  }
}

/**
 * Obtiene un proyecto por ID
 * Verifica que el usuario sea el propietario del proyecto
 */
export async function getProjectById(id: string): Promise<ProjectResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { error: 'Usuario no autenticado' };
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Solo puede ver sus propios proyectos
      .single();

    if (error) {
      console.error('Error getting project:', error);
      return { error: error.message };
    }

    return { data: data as LocalProject };
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return { error: 'Error al obtener el proyecto' };
  }
}

/**
 * Obtiene todos los proyectos del usuario autenticado
 */
export async function getUserProjects(): Promise<{ data?: LocalProject[]; error?: string }> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { error: 'Usuario no autenticado' };
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting projects:', error);
      return { error: error.message };
    }

    return { data: data as LocalProject[] };
  } catch (error) {
    console.error('Error in getUserProjects:', error);
    return { error: 'Error al obtener los proyectos' };
  }
}
