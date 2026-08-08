-- AFRIMED - Antécédents médicaux séparés des antécédents personnels
alter table public.patients
  add column if not exists medical_history text not null default '';

-- Remonte les antécédents médicaux temporairement packés dans personal_history
do $$
declare
  marker text := E'\n\n---ANTECEDENTS_MEDICAUX---\n';
begin
  update public.patients
  set
    medical_history = split_part(personal_history, marker, 2),
    personal_history = split_part(personal_history, marker, 1)
  where position(marker in personal_history) > 0
    and coalesce(medical_history, '') = '';
end $$;
