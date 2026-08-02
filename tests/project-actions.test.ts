import { describe, it, expect, vi } from 'vitest';

const mockSupabase = () => ({
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: '11111111-1111-1111-1111-111111111111' }, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '11111111-1111-1111-1111-111111111111' }, error: null })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: '11111111-1111-1111-1111-111111111111' }, error: null })),
      })),
    })),
  })),
});

vi.mock('../../lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabase())),
}));

import { createProject, updateProject, deleteProject, getProjectById } from '../app/actions/project-actions';

describe('project-actions', () => {
  const baseProject = {
    code: 'PRY-001',
    name: 'Proyecto Test',
    client_name: 'Cliente Test',
    client_phone: '12345678',
    client_email: 'test@example.com',
    location: 'Ciudad',
    typology: 'residential' as const,
    area_m2: 100,
    quality_level: 'moderate' as const,
    status: 'planning' as const,
    start_date: '2025-01-01',
    estimated_end_date: '2025-03-01',
    duration_days: 60,
    total_budget: 50000,
    budget_total: 52000,
    calculated_duration: 58,
  };

  it('crea un proyecto válido', async () => {
    const result = await createProject(baseProject);
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('falla con código vacío', async () => {
    const result = await createProject({ ...baseProject, code: '' });
    expect(result.error).toContain('código');
  });

  it('actualiza un proyecto existente', async () => {
    const result = await updateProject('11111111-1111-1111-1111-111111111111', { name: 'Nuevo nombre' });
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('rechaza id inválido en update', async () => {
    const result = await updateProject('id-invalido', { name: 'Nuevo nombre' });
    expect(result.error).toContain('inválido');
  });

  it('elimina un proyecto existente', async () => {
    const result = await deleteProject('11111111-1111-1111-1111-111111111111');
    expect(result.error).toBeNull();
    expect(result.success).toBe(true);
  });

  it('rechaza id inválido en delete', async () => {
    const result = await deleteProject('id-invalido');
    expect(result.error).toContain('inválido');
  });

  it('obtiene un proyecto por id', async () => {
    const result = await getProjectById('11111111-1111-1111-1111-111111111111');
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });
});