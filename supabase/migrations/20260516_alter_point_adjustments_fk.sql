TRUNCATE TABLE public.point_adjustments;

ALTER TABLE public.point_adjustments DROP CONSTRAINT IF EXISTS point_adjustments_user_id_fkey;
ALTER TABLE public.point_adjustments DROP CONSTRAINT IF EXISTS point_adjustments_admin_id_fkey;

ALTER TABLE public.point_adjustments 
  ADD CONSTRAINT point_adjustments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.point_adjustments 
  ADD CONSTRAINT point_adjustments_admin_id_fkey 
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
