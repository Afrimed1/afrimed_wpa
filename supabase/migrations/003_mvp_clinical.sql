-- AFRIMED - Phase 2 a 6 : dossier patient, consultations, laboratoire, ordonnances

alter table public.patients add column if not exists birth_date date;
alter table public.patients add column if not exists sex text;
alter table public.patients add column if not exists phone text;
alter table public.patients add column if not exists emergency_contact_name text;
alter table public.patients add column if not exists emergency_contact_phone text;
alter table public.patients add column if not exists personal_history text not null default '';
alter table public.patients add column if not exists family_history text not null default '';
alter table public.patients add column if not exists chronic_treatments text not null default '';
alter table public.patients add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_sex_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_sex_check check (sex in ('M', 'F', 'U'));
  end if;
end;
$$;

create table if not exists public.patient_allergies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  substance text not null,
  severity text not null check (severity in ('mild', 'moderate', 'severe')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  form text,
  default_posology text,
  is_active boolean not null default true
);

create table if not exists public.lab_exam_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text,
  is_active boolean not null default true
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id),
  patient_id uuid not null references public.patients(id),
  doctor_id uuid not null references public.profiles(id),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'awaiting_labs', 'closed', 'deferred')),
  motif text,
  history_of_illness text,
  temperature_c numeric(4,1),
  blood_pressure text,
  pulse_bpm integer,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  review_of_systems jsonb not null default '{}'::jsonb,
  physical_exam text,
  ai_suggestions jsonb,
  ai_decisions jsonb,
  diagnosis text,
  deferral_reason text,
  follow_up_date date,
  follow_up_notes text,
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consultation_lab_requests (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  patient_id uuid not null references public.patients(id),
  establishment_id uuid not null references public.establishments(id),
  requested_by uuid not null references public.profiles(id),
  exam_type_id uuid not null references public.lab_exam_types(id),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  result_text text,
  result_values jsonb,
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  patient_id uuid not null references public.patients(id),
  doctor_id uuid not null references public.profiles(id),
  establishment_id uuid not null references public.establishments(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication_id uuid references public.medications(id),
  medication_name text not null,
  posology text not null,
  duration text,
  allergy_override boolean not null default false,
  allergy_override_reason text
);

create index if not exists idx_patients_first_name on public.patients(first_name);
create index if not exists idx_patients_last_name on public.patients(last_name);
create index if not exists idx_patients_access_code_search on public.patients(access_code);
create index if not exists idx_consultations_status on public.consultations(status);
create index if not exists idx_consultations_establishment_status
  on public.consultations(establishment_id, status);
create index if not exists idx_lab_requests_status on public.consultation_lab_requests(status);
create index if not exists idx_lab_requests_establishment_status
  on public.consultation_lab_requests(establishment_id, status);
create index if not exists idx_patient_allergies_patient on public.patient_allergies(patient_id);
create index if not exists idx_consultations_patient on public.consultations(patient_id);
create index if not exists idx_prescriptions_consultation on public.prescriptions(consultation_id);

alter table public.patient_allergies enable row level security;
alter table public.medications enable row level security;
alter table public.lab_exam_types enable row level security;
alter table public.consultations enable row level security;
alter table public.consultation_lab_requests enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;

drop policy if exists "patients_select_staff_establishment" on public.patients;
drop policy if exists "patients_insert_staff_establishment" on public.patients;
drop policy if exists "patients_update_staff_establishment" on public.patients;
create policy "patients_select_staff_establishment"
  on public.patients for select to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and establishment_id = (public.current_profile()).establishment_id
  );
create policy "patients_insert_staff_establishment"
  on public.patients for insert to authenticated
  with check (
    coalesce((public.current_profile()).is_active, false)
    and establishment_id = (public.current_profile()).establishment_id
  );
create policy "patients_update_staff_establishment"
  on public.patients for update to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and establishment_id = (public.current_profile()).establishment_id
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and establishment_id = (public.current_profile()).establishment_id
  );

drop policy if exists "patient_allergies_staff_establishment" on public.patient_allergies;
create policy "patient_allergies_staff_establishment"
  on public.patient_allergies for all to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and exists (
      select 1 from public.patients
      where id = patient_allergies.patient_id
        and establishment_id = (public.current_profile()).establishment_id
    )
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and exists (
      select 1 from public.patients
      where id = patient_allergies.patient_id
        and establishment_id = (public.current_profile()).establishment_id
    )
  );

drop policy if exists "medications_select_staff" on public.medications;
drop policy if exists "medications_manage_admin" on public.medications;
create policy "medications_select_staff"
  on public.medications for select to authenticated
  using (coalesce((public.current_profile()).is_active, false));
create policy "medications_manage_admin"
  on public.medications for all to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') = 'admin'
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') = 'admin'
  );

drop policy if exists "lab_exam_types_select_staff" on public.lab_exam_types;
drop policy if exists "lab_exam_types_manage_admin" on public.lab_exam_types;
create policy "lab_exam_types_select_staff"
  on public.lab_exam_types for select to authenticated
  using (coalesce((public.current_profile()).is_active, false));
create policy "lab_exam_types_manage_admin"
  on public.lab_exam_types for all to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') = 'admin'
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') = 'admin'
  );

drop policy if exists "consultations_doctor_establishment" on public.consultations;
create policy "consultations_doctor_establishment"
  on public.consultations for all to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') in ('admin', 'doctor')
    and establishment_id = (public.current_profile()).establishment_id
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') in ('admin', 'doctor')
    and establishment_id = (public.current_profile()).establishment_id
    and (
      coalesce((public.current_profile()).role, '') = 'admin'
      or doctor_id = auth.uid()
    )
  );

drop policy if exists "lab_requests_select_staff_establishment" on public.consultation_lab_requests;
drop policy if exists "lab_requests_insert_doctor_establishment" on public.consultation_lab_requests;
drop policy if exists "lab_requests_update_lab_establishment" on public.consultation_lab_requests;
create policy "lab_requests_select_staff_establishment"
  on public.consultation_lab_requests for select to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and establishment_id = (public.current_profile()).establishment_id
  );
create policy "lab_requests_insert_doctor_establishment"
  on public.consultation_lab_requests for insert to authenticated
  with check (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') in ('admin', 'doctor')
    and establishment_id = (public.current_profile()).establishment_id
    and (
      coalesce((public.current_profile()).role, '') = 'admin'
      or requested_by = auth.uid()
    )
  );
create policy "lab_requests_update_lab_establishment"
  on public.consultation_lab_requests for update to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') in ('admin', 'lab')
    and establishment_id = (public.current_profile()).establishment_id
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') in ('admin', 'lab')
    and establishment_id = (public.current_profile()).establishment_id
  );

drop policy if exists "prescriptions_doctor_establishment" on public.prescriptions;
create policy "prescriptions_doctor_establishment"
  on public.prescriptions for all to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') in ('admin', 'doctor')
    and establishment_id = (public.current_profile()).establishment_id
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and coalesce((public.current_profile()).role, '') in ('admin', 'doctor')
    and establishment_id = (public.current_profile()).establishment_id
    and (
      coalesce((public.current_profile()).role, '') = 'admin'
      or doctor_id = auth.uid()
    )
  );

drop policy if exists "prescription_items_doctor_establishment" on public.prescription_items;
create policy "prescription_items_doctor_establishment"
  on public.prescription_items for all to authenticated
  using (
    coalesce((public.current_profile()).is_active, false)
    and exists (
      select 1 from public.prescriptions
      where id = prescription_items.prescription_id
        and establishment_id = (public.current_profile()).establishment_id
        and (
          coalesce((public.current_profile()).role, '') = 'admin'
          or (
            coalesce((public.current_profile()).role, '') = 'doctor'
            and doctor_id = auth.uid()
          )
        )
    )
  )
  with check (
    coalesce((public.current_profile()).is_active, false)
    and exists (
      select 1 from public.prescriptions
      where id = prescription_items.prescription_id
        and establishment_id = (public.current_profile()).establishment_id
        and (
          coalesce((public.current_profile()).role, '') = 'admin'
          or (
            coalesce((public.current_profile()).role, '') = 'doctor'
            and doctor_id = auth.uid()
          )
        )
    )
  );

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    drop trigger if exists patients_updated_at on public.patients;
    create trigger patients_updated_at
      before update on public.patients
      for each row execute function public.set_updated_at();

    drop trigger if exists consultations_updated_at on public.consultations;
    create trigger consultations_updated_at
      before update on public.consultations
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

insert into public.medications (id, name, form, default_posology) values
  ('10000000-0000-0000-0000-000000000001', 'Paracétamol', 'comprimé 500 mg', '1 à 2 comprimés toutes les 6 à 8 heures'),
  ('10000000-0000-0000-0000-000000000002', 'Ibuprofène', 'comprimé 400 mg', '1 comprimé toutes les 8 heures après repas'),
  ('10000000-0000-0000-0000-000000000003', 'Acide acétylsalicylique', 'comprimé 100 mg', 'Selon prescription médicale'),
  ('10000000-0000-0000-0000-000000000004', 'Artéméther + Luméfantrine', 'comprimé 20/120 mg', 'Selon poids, pendant 3 jours'),
  ('10000000-0000-0000-0000-000000000005', 'Artésunate injectable', 'injection 60 mg', 'Selon protocole paludisme grave'),
  ('10000000-0000-0000-0000-000000000006', 'Quinine', 'comprimé 300 mg', 'Selon poids et protocole'),
  ('10000000-0000-0000-0000-000000000007', 'Amoxicilline', 'gélule 500 mg', '1 gélule toutes les 8 heures'),
  ('10000000-0000-0000-0000-000000000008', 'Amoxicilline + Acide clavulanique', 'comprimé 875/125 mg', '1 comprimé toutes les 12 heures'),
  ('10000000-0000-0000-0000-000000000009', 'Azithromycine', 'comprimé 500 mg', '1 comprimé par jour'),
  ('10000000-0000-0000-0000-000000000010', 'Ciprofloxacine', 'comprimé 500 mg', '1 comprimé toutes les 12 heures'),
  ('10000000-0000-0000-0000-000000000011', 'Ceftriaxone', 'injection 1 g', 'Selon diagnostic et protocole'),
  ('10000000-0000-0000-0000-000000000012', 'Métronidazole', 'comprimé 500 mg', '1 comprimé toutes les 8 heures'),
  ('10000000-0000-0000-0000-000000000013', 'Cotrimoxazole', 'comprimé 800/160 mg', '1 comprimé toutes les 12 heures'),
  ('10000000-0000-0000-0000-000000000014', 'Doxycycline', 'gélule 100 mg', '1 gélule toutes les 12 heures'),
  ('10000000-0000-0000-0000-000000000015', 'Albendazole', 'comprimé 400 mg', '1 comprimé en prise unique'),
  ('10000000-0000-0000-0000-000000000016', 'Mébendazole', 'comprimé 100 mg', '1 comprimé matin et soir pendant 3 jours'),
  ('10000000-0000-0000-0000-000000000017', 'Oralit', 'sachet', '1 sachet dans 1 litre d''eau, boire fréquemment'),
  ('10000000-0000-0000-0000-000000000018', 'Zinc', 'comprimé dispersible 20 mg', '1 comprimé par jour pendant 10 à 14 jours'),
  ('10000000-0000-0000-0000-000000000019', 'Oméprazole', 'gélule 20 mg', '1 gélule par jour avant repas'),
  ('10000000-0000-0000-0000-000000000020', 'Salbutamol', 'inhalateur 100 mcg', '1 à 2 bouffées selon besoin'),
  ('10000000-0000-0000-0000-000000000021', 'Prednisone', 'comprimé 5 mg', 'Selon prescription médicale'),
  ('10000000-0000-0000-0000-000000000022', 'Dexaméthasone', 'injection 4 mg/ml', 'Selon prescription médicale'),
  ('10000000-0000-0000-0000-000000000023', 'Furosémide', 'comprimé 40 mg', 'Selon prescription médicale'),
  ('10000000-0000-0000-0000-000000000024', 'Amlodipine', 'comprimé 5 mg', '1 comprimé par jour'),
  ('10000000-0000-0000-0000-000000000025', 'Captopril', 'comprimé 25 mg', 'Selon prescription médicale'),
  ('10000000-0000-0000-0000-000000000026', 'Metformine', 'comprimé 500 mg', '1 comprimé matin et soir avec repas'),
  ('10000000-0000-0000-0000-000000000027', 'Insuline rapide', 'flacon injectable', 'Selon glycémie et prescription'),
  ('10000000-0000-0000-0000-000000000028', 'Fer + Acide folique', 'comprimé', '1 comprimé par jour'),
  ('10000000-0000-0000-0000-000000000029', 'Sulfate de fer', 'comprimé 200 mg', '1 comprimé matin et soir'),
  ('10000000-0000-0000-0000-000000000030', 'Acide folique', 'comprimé 5 mg', '1 comprimé par jour'),
  ('10000000-0000-0000-0000-000000000031', 'Vitamine C', 'comprimé 500 mg', '1 comprimé par jour'),
  ('10000000-0000-0000-0000-000000000032', 'Vitamine B complexe', 'comprimé', '1 comprimé par jour'),
  ('10000000-0000-0000-0000-000000000033', 'Loratadine', 'comprimé 10 mg', '1 comprimé par jour'),
  ('10000000-0000-0000-0000-000000000034', 'Chlorphénamine', 'comprimé 4 mg', '1 comprimé 2 à 3 fois par jour'),
  ('10000000-0000-0000-0000-000000000035', 'Clotrimazole', 'crème 1 %', 'Appliquer 2 fois par jour'),
  ('10000000-0000-0000-0000-000000000036', 'Fluconazole', 'gélule 150 mg', '1 gélule en prise unique'),
  ('10000000-0000-0000-0000-000000000037', 'Pommade antibiotique', 'pommade', 'Appliquer localement 2 fois par jour'),
  ('10000000-0000-0000-0000-000000000038', 'Lidocaïne', 'solution injectable 2 %', 'Selon geste médical'),
  ('10000000-0000-0000-0000-000000000039', 'Oxytocine', 'injection 10 UI/ml', 'Selon protocole obstétrical'),
  ('10000000-0000-0000-0000-000000000040', 'Sulfate de magnésium', 'injection 50 %', 'Selon protocole pré-éclampsie')
on conflict do nothing;

insert into public.lab_exam_types (id, code, name, category) values
  ('20000000-0000-0000-0000-000000000001', 'NFS', 'Numération formule sanguine', 'Hématologie'),
  ('20000000-0000-0000-0000-000000000002', 'GE', 'Goutte épaisse', 'Parasitologie'),
  ('20000000-0000-0000-0000-000000000003', 'TDR_PALU', 'Test de diagnostic rapide paludisme', 'Parasitologie'),
  ('20000000-0000-0000-0000-000000000004', 'GLYCEMIE', 'Glycémie', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000005', 'CREAT', 'Créatininémie', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000006', 'UREE', 'Urée sanguine', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000007', 'ASAT', 'ASAT', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000008', 'ALAT', 'ALAT', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000009', 'BILI', 'Bilirubine totale', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000010', 'CRP', 'Protéine C réactive', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000011', 'VS', 'Vitesse de sédimentation', 'Hématologie'),
  ('20000000-0000-0000-0000-000000000012', 'GS_RH', 'Groupe sanguin et Rhésus', 'Immuno-hématologie'),
  ('20000000-0000-0000-0000-000000000013', 'ECBU', 'Examen cytobactériologique des urines', 'Bactériologie'),
  ('20000000-0000-0000-0000-000000000014', 'BU', 'Bandelette urinaire', 'Urines'),
  ('20000000-0000-0000-0000-000000000015', 'COPRO', 'Examen parasitologique des selles', 'Parasitologie'),
  ('20000000-0000-0000-0000-000000000016', 'WIDAL', 'Sérodiagnostic de Widal', 'Sérologie'),
  ('20000000-0000-0000-0000-000000000017', 'VIH', 'Dépistage VIH', 'Sérologie'),
  ('20000000-0000-0000-0000-000000000018', 'VHB', 'Antigène HBs', 'Sérologie'),
  ('20000000-0000-0000-0000-000000000019', 'VHC', 'Dépistage hépatite C', 'Sérologie'),
  ('20000000-0000-0000-0000-000000000020', 'BW', 'Sérologie syphilis', 'Sérologie'),
  ('20000000-0000-0000-0000-000000000021', 'BHCG', 'Bêta-HCG', 'Hormonologie'),
  ('20000000-0000-0000-0000-000000000022', 'TP_TCA', 'TP et TCA', 'Hémostase'),
  ('20000000-0000-0000-0000-000000000023', 'ELECTRO', 'Ionogramme sanguin', 'Biochimie'),
  ('20000000-0000-0000-0000-000000000024', 'RETIC', 'Réticulocytes', 'Hématologie'),
  ('20000000-0000-0000-0000-000000000025', 'SPUTUM_BK', 'Recherche de BK dans les crachats', 'Bactériologie')
on conflict do nothing;
