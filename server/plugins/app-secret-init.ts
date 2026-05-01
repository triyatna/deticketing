import crypto from 'node:crypto'
import prisma from '../utils/prisma'
import {
  decryptSettingValue,
  encryptSettingValue,
  isEncryptedSettingValue,
} from '../utils/settingsCrypto'

const APP_SECRET_SETTING_KEY = 'APP_SECRET'

export default defineNitroPlugin(async () => {
  try {
    const existingEnvSecret = String(process.env.APP_SECRET || '').trim()

    // @ts-ignore: Prisma client typing can be stale in editor cache
    const dbSetting = await prisma.setting.findUnique({
      where: { key: APP_SECRET_SETTING_KEY },
      select: { value: true },
    })

    if (existingEnvSecret) {
      if (!dbSetting?.value) {
        // @ts-ignore: Prisma client typing can be stale in editor cache
        await prisma.setting.upsert({
          where: { key: APP_SECRET_SETTING_KEY },
          update: { value: encryptSettingValue(existingEnvSecret) },
          create: { key: APP_SECRET_SETTING_KEY, value: encryptSettingValue(existingEnvSecret) },
        })
      }
      return
    }

    if (dbSetting?.value) {
      const resolved = isEncryptedSettingValue(dbSetting.value)
        ? decryptSettingValue(dbSetting.value)
        : String(dbSetting.value || '')

      process.env.APP_SECRET = String(resolved || '').trim()
      if (process.env.APP_SECRET) return
    }

    const generated = crypto.randomBytes(48).toString('hex')
    process.env.APP_SECRET = generated

    // @ts-ignore: Prisma client typing can be stale in editor cache
    await prisma.setting.upsert({
      where: { key: APP_SECRET_SETTING_KEY },
      update: { value: encryptSettingValue(generated) },
      create: { key: APP_SECRET_SETTING_KEY, value: encryptSettingValue(generated) },
    })
  } catch (error) {
    console.error('APP_SECRET init failed:', error)
  }
})

