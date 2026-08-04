import bcrypt from 'bcryptjs'

const password = process.argv[2]
const hash = process.argv[3]

if (!password || !hash) {
  console.log('Usage: node scripts/test-login.mjs <mot-de-passe> <hash>')
  process.exit(1)
}

const result = await bcrypt.compare(password, hash)
console.log(result ? '✅ Mot de passe correct' : '❌ Mot de passe incorrect')
