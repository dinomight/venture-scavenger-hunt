import type { Client } from '@libsql/client';

export async function ensureSchema(client: Client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS years (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      join_code TEXT NOT NULL,
      required_targets INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );
  `);

  // Idempotent column addition for existing databases
  try {
    await client.execute('ALTER TABLE years ADD COLUMN required_targets INTEGER');
  } catch {
    // Column already exists or already migrated
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS targets (
      id TEXT PRIMARY KEY,
      year_id TEXT NOT NULL REFERENCES years(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      category_tag TEXT,
      status TEXT NOT NULL DEFAULT 'NEEDED',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      target_id TEXT NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      photographer_name TEXT,
      caption TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  // Seed default 2026 year session if database is fresh
  const existingYears = await client.execute('SELECT COUNT(*) as count FROM years');
  const count = Number(existingYears.rows[0]?.count || 0);

  if (count === 0) {
    const yearId = 'year-2026';
    const now = Date.now();
    await client.execute({
      sql: 'INSERT INTO years (id, year, title, join_code, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [yearId, 2026, 'DragonCon 2026 Scavenger Hunt', 'VENTURE26', 1, now],
    });

    const sampleTargets = [
      { name: 'Brock Samson in speedo', category: 'Team Venture', desc: 'Usually spotted near the pool or Marriott atrium' },
      { name: 'Dr. Thaddeus "Rusty" Venture (Speedsuit)', category: 'Team Venture', desc: 'Classic red speedsuit, smoking cigarette optional' },
      { name: 'Hank & Dean Venture duo', category: 'Team Venture', desc: 'Matching sweater vest and Hank in jacket' },
      { name: 'Dr. Girlfriend / Dr. Mrs. The Monarch (Jackie O style)', category: 'Guild of Calamitous Intent', desc: 'Pillbox hat, yellow suit' },
      { name: 'The Monarch (Full Wings & Crown)', category: 'Guild of Calamitous Intent', desc: 'Massive butterfly wings, yellow crown' },
      { name: 'Henchman 21 & 24 (The Two-Ton Twenty-One)', category: 'Henchmen', desc: 'Yellow & black wings, driving the Stanza' },
      { name: 'Dr. Henry Killinger with Magic Murder Bag', category: 'Guild of Calamitous Intent', desc: 'Umbrella and bowler hat' },
      { name: 'Shore Leave (SPHINX!)', category: 'SPHINX', desc: 'Boom! Yummy! SPHINX outfit' },
      { name: 'Red Death (Gentleman Villain on horseback)', category: 'Guild of Calamitous Intent', desc: 'Skull face, crimson cloak' },
      { name: 'The Sovereign (David Bowie / Diamond Dogs)', category: 'Guild of Calamitous Intent', desc: 'Ziggy Stardust or Thin White Duke persona' },
      { name: 'Molotov Cocktease with eyepatch', category: 'Allies & Enemies', desc: 'Black catsuit, red star' },
      { name: 'Action Johnny in recovery', category: 'Team Venture', desc: 'Turban and robe' },
    ];

    for (let i = 0; i < sampleTargets.length; i++) {
      const item = sampleTargets[i];
      await client.execute({
        sql: 'INSERT INTO targets (id, year_id, name, description, category_tag, status, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [`target-2026-${i + 1}`, yearId, item.name, item.desc, item.category, 'NEEDED', i, now + i],
      });
    }
  }
}
