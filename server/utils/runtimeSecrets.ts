import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const RUNTIME_DIR_NAME = 'data'
const RUNTIME_SECRETS_FILE = 'runtime-secrets.json'

const getCandidateBaseDirs = () => {
  const cwd = process.cwd()
  const bases = [
    cwd,
    path.resolve(cwd, '..'),
    path.resolve(cwd, '..', '..'),
    path.resolve(cwd, '..', '..', '..')
  ]

  return Array.from(new Set(bases))
}

const pickBaseDir = () => {
  const bases = getCandidateBaseDirs()

  const withPrismaSchema = bases.find((base) =>
    fs.existsSync(path.resolve(base, 'prisma', 'schema.prisma'))
  )
  if (withPrismaSchema) return withPrismaSchema

  const withPackageJson = bases.find((base) =>
    fs.existsSync(path.resolve(base, 'package.json'))
  )
  if (withPackageJson) return withPackageJson

  return bases[0]
}

export const getRuntimeDataDir = () => {
  const base = pickBaseDir()
  const dir = path.resolve(base, RUNTIME_DIR_NAME)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

const readSecretsFile = (): Record<string, string> => {
  try {
    const filePath = path.resolve(getRuntimeDataDir(), RUNTIME_SECRETS_FILE)
    if (!fs.existsSync(filePath)) return {}
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

const writeSecretsFile = (data: Record<string, string>) => {
  const filePath = path.resolve(getRuntimeDataDir(), RUNTIME_SECRETS_FILE)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

export const getRuntimeSecret = (key: string) => {
  const map = readSecretsFile()
  return String(map[key] || '').trim()
}

export const setRuntimeSecret = (key: string, value: string) => {
  const map = readSecretsFile()
  map[key] = String(value || '').trim()
  writeSecretsFile(map)
}

export const getOrCreateRuntimeSecret = (key: string, bytes = 48) => {
  const existing = getRuntimeSecret(key)
  if (existing) return existing
  const generated = crypto.randomBytes(bytes).toString('hex')
  setRuntimeSecret(key, generated)
  return generated
}

export const getCandidateBaseDirsForRuntime = getCandidateBaseDirs

