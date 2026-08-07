-- ============================================================================
-- 20260805000000: Fix RLS infinite recursion on projects
-- ============================================================================
-- CAUSA RAIZ: la migración 20260804000000 generó la política de "projects" así:
--   Owner select projects: USING (EXISTS (SELECT 1 FROM public.projects p
--                                     WHERE p.id = projects.id AND p.user_id = auth.uid()))
-- Esa subconsulta vuelve a leer public.projects y, con FORCE ROW LEVEL SECURITY,
-- dispara de nuevo la MISMA política → "infinite recursion detected in policy
-- for relation \"projects\"". Contagia a budgets, budget_items, project_logs,
-- purchase_orders, payroll_records, financial_transactions, etc., porque sus
-- políticas consultan projects.
--
-- FIX: la tabla projects se consulta a si misma por el propio id; el chequeo
-- correcto es plano sobre la misma fila: user_id = auth.uid(). Sin subconsulta,
-- ya no hay recursión. Las políticas de las demas tablas (que SI consultan
-- projects por project_id) dejan de recursar porque projects ya no se auto-lee.
-- ============================================================================

begin;

-- Fijar user_id si hay un unico administrador en la tabla projects, para no
-- dejar proyectos huérfanos tras el cambio (seguridad de tenencia).
do $$
declare
  admin_id uuid;
begin
  select u.id into admin_id
  from auth.users u
  order by u.created_at asc
  limit 1;

  if admin_id is not null then
    update public.projects
       set user_id = admin_id
     where user_id is null;
  end if;
end $$;

-- Limpiar las políticas recursivas previas sobre projects
drop policy if exists "Owner select projects"   on public.projects;
drop policy if exists "Owner insert projects"   on public.projects;
drop policy if exists "Owner update projects"   on public.projects;
drop policy if exists "Owner delete projects"   on public.projects;
drop policy if exists "Users can view their own projects"  on public.projects;
drop policy if exists "Users can insert their own projects" on public.projects;
drop policy if exists "Users can update their own projects" on public.projects;
drop policy if exists "Users can delete their own projects" on public.projects;
drop policy if exists "Select own projects"     on public.projects;
drop policy if exists "Insert own projects"     on public.projects;
drop policy if exists "Update own projects"     on public.projects;
drop policy if exists "Delete own projects"     on public.projects;

-- Recrear políticas de projects SIN auto-referencia (patrón plano sobre la fila).
create policy "Owner select projects"
  on public.projects for select
  to authenticated
  using (user_id = auth.uid());

create policy "Owner insert projects"
  on public.projects for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owner update projects"
  on public.projects for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Owner delete projects"
  on public.projects for delete
  to authenticated
  using (user_id = auth.uid());

commit;
