import { defineEventHandler, getCookie, createError, getRouterParam, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import bcrypt from 'bcrypt'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER')) {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }


  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID staff wajib diisi' })
  }
  const body = await readBody(event)
  const { password, email, role } = body

  if (!password && !email && !role) {
    throw createError({ statusCode: 400, statusMessage: 'Data baru wajib diisi' })
  }

  try {
    const target = await prisma.admin.findUnique({ where: { id } })
    if (!target) throw createError({ statusCode: 404, statusMessage: 'Staff tidak ditemukan' })

    const roleHierarchy: any = { OWNER: 4, ADMIN: 3, PANITIA: 2, PETUGAS: 1 }
    if (decoded.role === 'ADMIN' && roleHierarchy[target.role] >= 3) {
      // Allow if editing self
      if (decoded.id !== target.id) {
        throw createError({ statusCode: 403, statusMessage: 'Admin tidak bisa mengubah data Admin lain atau Owner.' })
      }
    }


    if (role) {
      if (role === 'OWNER') {
        throw createError({ statusCode: 403, statusMessage: 'Role Owner hanya bisa ada satu di sistem.' })
      }

      if (decoded.role === 'OWNER') {
        // Owner can change to anything (except OWNER, handled above)
      } else if (decoded.role === 'ADMIN') {
        // Admin can only change role if target is below them
        if (roleHierarchy[target.role] >= 3) {
           throw createError({ statusCode: 403, statusMessage: 'Admin tidak bisa mengubah role Admin/Owner.' })
        }
        // Admin cannot promote someone to OWNER or ADMIN
        if (role === 'OWNER' || role === 'ADMIN') {
           throw createError({ statusCode: 403, statusMessage: 'Admin hanya bisa mengubah role menjadi Panitia atau Petugas.' })
        }

      } else {
        throw createError({ statusCode: 403, statusMessage: 'Akses ditolak untuk mengganti role.' })
      }
    }


    const updateData: any = {}
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (email) {
      const existingEmail = await prisma.admin.findFirst({
        where: { 
          email,
          NOT: { id }
        }
      })
      if (existingEmail) {
        throw createError({ statusCode: 400, statusMessage: 'Email sudah terpakai oleh staff lain' })
      }
      updateData.email = email
    }

    if (role) {
      updateData.role = role
    }

    await prisma.admin.update({

      where: { id },
      data: updateData
    })

    return { success: true, message: 'Data staff berhasil diperbarui.' }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal memperbarui staff' })
  }

})
