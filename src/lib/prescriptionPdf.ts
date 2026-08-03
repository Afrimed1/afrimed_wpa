export interface PrescriptionPdfItem {
  medicationName: string
  posology: string
  duration?: string | null
}

export interface PrescriptionPdfInput {
  establishmentName: string
  doctorName: string
  patientName: string
  patientCode: string
  date: string
  diagnosis?: string | null
  items: PrescriptionPdfItem[]
  notes?: string | null
}

export async function downloadPrescriptionPdf(input: PrescriptionPdfInput): Promise<void> {
  const lines = [
    input.establishmentName,
    'Ordonnance medicale',
    '',
    `Medecin : ${input.doctorName}`,
    `Patient : ${input.patientName}`,
    `Code patient : ${input.patientCode}`,
    `Date : ${input.date}`,
    ...(input.diagnosis ? [`Diagnostic : ${input.diagnosis}`] : []),
    '',
    'Traitement',
    ...input.items.map((item, index) => `${index + 1}. ${item.medicationName} : ${item.posology}${item.duration ? ` - ${item.duration}` : ''}`),
    ...(input.notes ? ['', `Notes : ${input.notes}`] : []),
  ].flatMap((line) => wrapText(line))
  const stream = ['BT', '/F1 11 Tf', '50 790 Td', '14 TL', ...lines.flatMap((line, index) => [
    `(${escapePdfText(line)}) Tj`,
    ...(index < lines.length - 1 ? ['T*'] : []),
  ]), 'ET'].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  const safeCode = input.patientCode.replace(/[^a-zA-Z0-9_-]/g, '-')
  link.download = `ordonnance-${safeCode || 'patient'}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

function escapePdfText(value: string) {
  return value.replace(/([\\()])/g, '\\$1').replace(/[^\x20-\x7E]/g, '?')
}

function wrapText(value: string, width = 72): string[] {
  if (value.length <= width) return [value]
  const words = value.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width && line) {
      lines.push(line)
      line = word
    } else line = `${line} ${word}`.trim()
  }
  if (line) lines.push(line)
  return lines
}
