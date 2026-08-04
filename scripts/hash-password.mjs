import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.log('Usage: node scripts/hash-password.mjs <mot-de-passe>')
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
console.log(hash)
