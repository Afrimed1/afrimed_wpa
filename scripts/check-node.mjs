#!/usr/bin/env node
/**
 * Vérifie Node >= 22 pour ce projet (sans toucher au Node global / default nvm).
 * Utilisez: cd afrimed_wpa && nvm use
 */
const major = Number(process.versions.node.split('.')[0])
if (Number.isNaN(major) || major < 22) {
  console.error('')
  console.error(`❌ AFRIMED nécessite Node.js 22+ (actuel: ${process.version}).`)
  console.error('')
  console.error('Sans changer votre Node par défaut (autres projets):')
  console.error('  cd afrimed_wpa')
  console.error('  nvm use          # lit .nvmrc → Node 22 pour ce terminal seulement')
  console.error('  npm run dev')
  console.error('')
  console.error('Si Node 22 n’est pas installé: nvm install')
  console.error('')
  process.exit(1)
}
