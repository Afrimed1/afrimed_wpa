const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateAccessCode(length = 6): string {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('La longueur du code doit être un entier positif.')
  }

  const values = new Uint32Array(length)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values)
    return Array.from(values, (value) => ACCESS_CODE_ALPHABET[value % ACCESS_CODE_ALPHABET.length]).join('')
  }

  return Array.from(
    { length },
    () => ACCESS_CODE_ALPHABET[Math.floor(Math.random() * ACCESS_CODE_ALPHABET.length)],
  ).join('')
}
