/** Structures métier pour Nouveau patient & Interrogatoire */

export type AdministrativeInfo = {
  profession: string
  birth_place: string
  province: string
  family_address: string
  religion: string
  iup_number: string
  service: string
  registration_number: string
  category: string
  entry_date: string
  entry_time: string
  exit_date: string
}

export type PersonalAntecedents = {
  medicaux: string
  chirurgicaux: string
  vaccinaux: string
  allergiques: string
  autres: string
}

export type FamilyAntecedents = {
  ascendants: string
  collateraux: string
  descendants: string
}

export type AntecedentsState = {
  personnels: PersonalAntecedents
  familiaux: FamilyAntecedents
  habitudes: string
}

export type InterrogatoireState = {
  motif: string
  history_of_illness: string
  antecedents: AntecedentsState
}

export const emptyAdministrativeInfo = (): AdministrativeInfo => ({
  profession: '',
  birth_place: '',
  province: '',
  family_address: '',
  religion: '',
  iup_number: '',
  service: '',
  registration_number: '',
  category: '',
  entry_date: '',
  entry_time: '',
  exit_date: '',
})

export const emptyAntecedents = (): AntecedentsState => ({
  personnels: {
    medicaux: '',
    chirurgicaux: '',
    vaccinaux: '',
    allergiques: '',
    autres: '',
  },
  familiaux: {
    ascendants: '',
    collateraux: '',
    descendants: '',
  },
  habitudes: '',
})

export const emptyInterrogatoire = (): InterrogatoireState => ({
  motif: '',
  history_of_illness: '',
  antecedents: emptyAntecedents(),
})

const ADMIN_MARKER = '\n\n---ADMIN_JSON---\n'
const ANTECEDENTS_MARKER = '\n\n---ANTECEDENTS_JSON---\n'

export function packAdministrativeInfo(
  personalHistory: string,
  admin: AdministrativeInfo,
): string {
  const base = personalHistory.split(ADMIN_MARKER)[0].trimEnd()
  return `${base}${ADMIN_MARKER}${JSON.stringify(admin)}`
}

export function unpackAdministrativeInfo(personalHistory: string | null | undefined): {
  personalHistory: string
  admin: AdministrativeInfo
} {
  const raw = personalHistory || ''
  const index = raw.indexOf(ADMIN_MARKER)
  if (index === -1) {
    return { personalHistory: raw, admin: emptyAdministrativeInfo() }
  }
  const base = raw.slice(0, index)
  try {
    const parsed = JSON.parse(raw.slice(index + ADMIN_MARKER.length)) as Partial<AdministrativeInfo>
    return {
      personalHistory: base,
      admin: { ...emptyAdministrativeInfo(), ...parsed },
    }
  } catch {
    return { personalHistory: base, admin: emptyAdministrativeInfo() }
  }
}

export function packAntecedentsIntoHistories(antecedents: AntecedentsState): {
  personal_history: string
  medical_history: string
  family_history: string
  chronic_treatments: string
} {
  return {
    medical_history: antecedents.personnels.medicaux,
    personal_history: [
      antecedents.personnels.chirurgicaux && `Chirurgicaux: ${antecedents.personnels.chirurgicaux}`,
      antecedents.personnels.vaccinaux && `Vaccinaux: ${antecedents.personnels.vaccinaux}`,
      antecedents.personnels.allergiques && `Allergiques: ${antecedents.personnels.allergiques}`,
      antecedents.personnels.autres && `Autres: ${antecedents.personnels.autres}`,
    ]
      .filter(Boolean)
      .join('\n'),
    family_history: [
      antecedents.familiaux.ascendants && `Ascendants: ${antecedents.familiaux.ascendants}`,
      antecedents.familiaux.collateraux && `Collatéraux: ${antecedents.familiaux.collateraux}`,
      antecedents.familiaux.descendants && `Descendants: ${antecedents.familiaux.descendants}`,
    ]
      .filter(Boolean)
      .join('\n'),
    chronic_treatments: `${antecedents.habitudes}${ANTECEDENTS_MARKER}${JSON.stringify(antecedents)}`,
  }
}

export function unpackAntecedentsFromPatient(patient: {
  personal_history?: string | null
  medical_history?: string | null
  family_history?: string | null
  chronic_treatments?: string | null
}): AntecedentsState {
  const treatments = patient.chronic_treatments || ''
  const markerIndex = treatments.indexOf(ANTECEDENTS_MARKER)
  if (markerIndex !== -1) {
    try {
      const parsed = JSON.parse(
        treatments.slice(markerIndex + ANTECEDENTS_MARKER.length),
      ) as AntecedentsState
      return {
        ...emptyAntecedents(),
        ...parsed,
        personnels: { ...emptyAntecedents().personnels, ...parsed.personnels },
        familiaux: { ...emptyAntecedents().familiaux, ...parsed.familiaux },
      }
    } catch {
      /* fall through */
    }
  }
  return {
    personnels: {
      medicaux: patient.medical_history || '',
      chirurgicaux: '',
      vaccinaux: '',
      allergiques: '',
      autres: patient.personal_history || '',
    },
    familiaux: {
      ascendants: patient.family_history || '',
      collateraux: '',
      descendants: '',
    },
    habitudes: markerIndex === -1 ? treatments : treatments.slice(0, markerIndex),
  }
}

export function readAntecedentsFromReview(
  review: unknown,
  fallback: AntecedentsState,
): AntecedentsState {
  if (!review || typeof review !== 'object' || Array.isArray(review)) return fallback
  const antecedents = (review as Record<string, unknown>).antecedents
  if (!antecedents || typeof antecedents !== 'object') return fallback
  const value = antecedents as Partial<AntecedentsState>
  return {
    personnels: { ...emptyAntecedents().personnels, ...value.personnels },
    familiaux: { ...emptyAntecedents().familiaux, ...value.familiaux },
    habitudes: value.habitudes ?? fallback.habitudes,
  }
}
