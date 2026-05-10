import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';

// Helper to find the database path (mirroring server/utils/prisma.ts logic)
const getDatabasePath = () => {
  const dbUrlRaw = String(process.env.DATABASE_URL || "").trim();
  if (dbUrlRaw.startsWith("file:")) {
    const rawPath = dbUrlRaw.slice("file:".length).split("?")[0];
    return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  }

  const candidates = [
    path.resolve(process.cwd(), "prisma", "dev.db"),
    path.resolve(process.cwd(), "dev.db"),
    path.resolve(process.cwd(), "data", "dev.db")
  ];
  return candidates.find(p => fs.existsSync(p)) || candidates[0];
};

async function migrate() {
  console.log('--- DATA MIGRATION: TICKET NOMINAL ---');
  const dbPath = getDatabasePath();
  console.log('Using database at:', dbPath);

  if (!fs.existsSync(dbPath)) {
    console.warn('Database file not found, skipping data migration.');
    return;
  }

  const client = createClient({
    url: `file:${dbPath}`,
  });

  try {
    const events = await client.execute('SELECT id, name, formSchema FROM Event');
    
    let totalUpdated = 0;
    for (const event of events.rows) {
      const eventId = event.id;
      const formSchema = String(event.formSchema || '[]');

      try {
        const schema = JSON.parse(formSchema);
        const meta = Array.isArray(schema) ? schema.find(s => s.itemType === 'form_meta') : {};
        const nominal = Number(meta?.nominal || 0);

        if (nominal > 0) {
          const result = await client.execute({
            sql: 'UPDATE Ticket SET nominal = ? WHERE eventId = ? AND (nominal IS NULL OR nominal = 0)',
            args: [nominal, eventId]
          });
          if (result.rowsAffected > 0) {
            console.log(`  Event "${event.name}": Updated ${result.rowsAffected} tickets to nominal ${nominal}.`);
            totalUpdated += Number(result.rowsAffected);
          }
        }
      } catch (e) {
        // Skip silent errors for individual events
      }
    }

    if (totalUpdated === 0) {
      console.log('  No tickets needed updating.');
    } else {
      console.log(`  Total tickets migrated: ${totalUpdated}`);
    }
    console.log('--- DATA MIGRATION COMPLETED ---');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

migrate();
