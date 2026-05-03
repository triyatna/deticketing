import { createClient } from '@libsql/client'
import path from 'node:path'

const dbPath = path.resolve('prisma/dev.db')
const url = `file:${dbPath}`

async function main() {
  console.log('Connecting to:', url)
  const client = createClient({ url })

  try {
    // Find the first admin
    const res = await client.execute('SELECT id, username, role FROM Admin ORDER BY createdAt ASC LIMIT 1')
    if (res.rows.length > 0) {
      const firstUser = res.rows[0]
      console.log('Found user:', firstUser.username, 'current role:', firstUser.role)
      
      await client.execute({
        sql: 'UPDATE Admin SET role = ? WHERE id = ?',
        args: ['OWNER', firstUser.id]
      })
      console.log('Successfully updated to OWNER')
    } else {
      console.log('No users found in Admin table')
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    client.close()
  }
}

main()
