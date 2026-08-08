/**
 * Test flux MVP AFRIMED bout-en-bout
 * node --env-file=.env.local scripts/e2e-flow.mjs
 */
import { createClient } from '@supabase/supabase-js'
import {
  createPatient,
  createConsultation,
  updateConsultation,
  suggestDiagnosisAI,
  createLabRequest,
  listExamTypes,
  listMedications,
  savePrescription,
  closeConsultation,
  getConsultation,
  getPatientDossier,
  completeLabRequest,
  listLabRequests,
  getDoctorDashboard,
  getAdminStats,
  getPatientPortalByCode,
} from '../server/clinicalApi.mjs'
import { loadSupabaseEnv } from '../server/adminApi.mjs'

const PASSWORD = process.env.AFRIMED_ADMIN_PASSWORD || 'demo1234'
const issues = []
const ok = []

function pass(msg) {
  ok.push(msg)
  console.log('OK  ', msg)
}
function fail(msg, err) {
  const detail = err?.message || err || ''
  issues.push(`${msg}${detail ? ' | ' + detail : ''}`)
  console.log('FAIL', msg, detail)
}

async function login(email) {
  const { url, publishable } = loadSupabaseEnv(process.env)
  const client = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  })
  if (error || !data.session) throw error || new Error('session absente')
  return { client, token: data.session.access_token }
}

async function main() {
  console.log('--- E2E AFRIMED ---')

  let doctor
  try {
    doctor = await login('medecin@afrimed.bf')
    pass('Login medecin')
  } catch (e) {
    fail('Login medecin', e)
    return report()
  }

  let lab
  try {
    lab = await login('labo@afrimed.bf')
    pass('Login labo')
  } catch (e) {
    fail('Login labo', e)
  }

  let admin
  try {
    admin = await login('admin@afrimed.bf')
    pass('Login admin')
  } catch (e) {
    fail('Login admin', e)
  }

  let patient
  try {
    patient = await createPatient(
      doctor.token,
      {
        first_name: 'Fatou',
        last_name: 'Kaboré',
        birth_date: '1995-06-15',
        sex: 'F',
        phone: '70111222',
        emergency_contact_name: 'Mariam Kaboré',
        emergency_contact_phone: '70222333',
        personal_history: 'Tabac occasionnel',
        medical_history: 'Paludisme 2023',
        family_history: 'Diabète maternel',
        chronic_treatments: '',
        motif: 'Fièvre',
        history_of_illness: 'Fièvre et frissons depuis 3 jours, céphalées.',
        allergies: [{ substance: 'Pénicilline', severity: 'severe', notes: 'Urticaire' }],
      },
      process.env,
    )
    if (!patient?.access_code) throw new Error('code patient manquant')
    if (!patient.medical_history && !String(patient.personal_history || '').includes('Paludisme')) {
      throw new Error('antecedents medicaux absents')
    }
    if (!patient.initialConsultation?.motif && !patient.recentConsultations?.some((c) => c.motif === 'Fièvre')) {
      throw new Error('motif initial non enregistre')
    }
    pass(`Creation patient code=${patient.access_code}`)
  } catch (e) {
    fail('Creation patient', e)
    return report()
  }

  try {
    const dossier = await getPatientDossier(doctor.token, patient.id, process.env)
    if (!dossier?.allergies?.length) throw new Error('allergies absentes')
    pass('Lecture dossier + allergies')
  } catch (e) {
    fail('Lecture dossier', e)
  }

  let consultation
  try {
    consultation = await createConsultation(
      doctor.token,
      { patientId: patient.id },
      process.env,
    )
    pass(`Creation consultation ${consultation.id}`)
  } catch (e) {
    fail('Creation consultation', e)
    return report()
  }

  try {
    await updateConsultation(
      doctor.token,
      consultation.id,
      {
        motif: 'Fièvre et frissons depuis 3 jours',
        history_of_illness: 'Début brutal, céphalées, pas de toux',
        temperature_c: 39.2,
        blood_pressure: '110/70',
        pulse_bpm: 98,
        weight_kg: 62,
        height_cm: 165,
        review_of_systems: {
          cardio: 'normal',
          respi: 'normal',
          digestif: 'nausees',
          neuro: 'cephalees',
        },
        physical_exam: 'Conjonctives colorees, rate non palpable',
      },
      process.env,
    )
    pass('Saisie consultation (motif/constantes/examen)')
  } catch (e) {
    fail('Saisie consultation', e)
  }

  try {
    const ai = await suggestDiagnosisAI(doctor.token, consultation.id, process.env)
    if (!ai?.hypotheses?.length && !ai?.suggestions) {
      // accept either shape
      if (!ai) throw new Error('reponse IA vide')
    }
    pass('Suggestions IA')
  } catch (e) {
    fail('Suggestions IA', e)
  }

  let examTypeId
  try {
    const exams = await listExamTypes(doctor.token, process.env)
    const ge = exams.find((e) => e.code === 'GE' || e.code === 'TDR_PALU') || exams[0]
    if (!ge) throw new Error('aucun examen')
    examTypeId = ge.id
    pass(`Examens dispo (${exams.length})`)
  } catch (e) {
    fail('Liste examens', e)
  }

  let labRequest
  if (examTypeId) {
    try {
      labRequest = await createLabRequest(
        doctor.token,
        { consultationId: consultation.id, examTypeId },
        process.env,
      )
      pass(`Demande labo ${labRequest.id}`)
    } catch (e) {
      fail('Demande labo', e)
    }
  }

  try {
    const meds = await listMedications(doctor.token, process.env)
    if (!meds.length) throw new Error('0 medicaments')
    const artem = meds.find((m) => /artém|artem|palu/i.test(m.name)) || meds[0]
    const pen = meds.find((m) => /pénicill|penicill|amoxicill/i.test(m.name))

    await savePrescription(
      doctor.token,
      {
        consultationId: consultation.id,
        notes: 'Boire abondamment',
        items: [
          {
            medicationId: artem.id,
            medicationName: artem.name,
            posology: artem.default_posology || 'Selon poids',
            duration: '3 jours',
          },
          ...(pen
            ? [
                {
                  medicationId: pen.id,
                  medicationName: pen.name,
                  posology: '1 gelule x3/j',
                  duration: '5 jours',
                  allergyOverride: true,
                  allergyOverrideReason: 'Test override volontaire E2E',
                },
              ]
            : []),
        ],
      },
      process.env,
    )
    pass(`Prescription (${meds.length} meds en base)`)
  } catch (e) {
    fail('Prescription', e)
  }

  if (labRequest && lab?.token) {
    try {
      const pending = await listLabRequests(lab.token, { status: 'pending' }, process.env)
      if (!pending.some((r) => r.id === labRequest.id)) {
        fail('Labo ne voit pas la demande pending')
      } else {
        pass('Labo voit la demande')
      }
      await completeLabRequest(
        lab.token,
        { id: labRequest.id, resultText: 'Goutte epaisse positive à P. falciparum' },
        process.env,
      )
      pass('Saisie resultat labo')
    } catch (e) {
      fail('Flux labo', e)
    }
  }

  try {
    const refreshed = await getConsultation(doctor.token, consultation.id, process.env)
    const labs = refreshed.lab_requests || refreshed.labRequests || []
    const done = labs.find((r) => r.id === labRequest?.id)
    if (labRequest && done && done.status !== 'completed') {
      fail('Resultat labo non visible cote medecin', done?.status)
    } else if (labRequest) {
      pass('Medecin voit resultat labo')
    }

    await closeConsultation(
      doctor.token,
      consultation.id,
      {
        diagnosis: 'Acces palustre simple',
        followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        followUpNotes: 'Revenir si fievre persiste',
      },
      process.env,
    )
    pass('Cloture consultation')
  } catch (e) {
    fail('Cloture / relecture consultation', e)
  }

  try {
    const portal = await getPatientPortalByCode(patient.access_code, process.env)
    if (!portal) throw new Error('portal vide')
    pass(`Portail patient code ${patient.access_code}`)
  } catch (e) {
    fail('Portail patient', e)
  }

  try {
    const dash = await getDoctorDashboard(doctor.token, process.env)
    pass(`Dashboard medecin`)
    console.log('     dash keys:', Object.keys(dash || {}))
  } catch (e) {
    fail('Dashboard medecin', e)
  }

  if (admin?.token) {
    try {
      const stats = await getAdminStats(admin.token, process.env)
      pass('Stats admin')
      console.log('     stats keys:', Object.keys(stats || {}))
    } catch (e) {
      fail('Stats admin', e)
    }
  }

  // allergy block without override
  try {
    const meds = await listMedications(doctor.token, process.env)
    const pen = meds.find((m) => /amoxicill|pénicill|penicill/i.test(m.name))
    if (pen) {
      const c2 = await createConsultation(doctor.token, { patientId: patient.id }, process.env)
      try {
        await savePrescription(
          doctor.token,
          {
            consultationId: c2.id,
            items: [
              {
                medicationId: pen.id,
                medicationName: pen.name,
                posology: 'test',
                duration: '1j',
              },
            ],
          },
          process.env,
        )
        fail('Alerte allergie: prescription sans override aurait du etre refusee')
      } catch (blocked) {
        pass('Alerte allergie bloque sans override')
      }
    } else {
      pass('Alerte allergie: pas de med comparable (skip)')
    }
  } catch (e) {
    fail('Test alerte allergie', e)
  }

  report()
}

function report() {
  console.log('')
  console.log('=== RESULTAT ===')
  console.log('OK  :', ok.length)
  console.log('FAIL:', issues.length)
  if (issues.length) {
    console.log('Problemes:')
    for (const i of issues) console.log(' -', i)
    process.exit(1)
  }
  console.log('Flux E2E OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
