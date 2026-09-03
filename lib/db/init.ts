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

  await client.execute(`
    CREATE TABLE IF NOT EXISTS system_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default 2026 year session if database is fresh
  const seedMeta = await client.execute("SELECT value FROM system_meta WHERE key = 'seeded'");
  if (seedMeta.rows.length === 0) {
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
        { name: 'Brock Samson in speedo', category: 'Team Venture', desc: 'Go ahead. Take it from me.' },
        { name: 'Dr. Thaddeus "Rusty" Venture (Speedsuit)', category: 'Team Venture', desc: "Super-science, Hank! It's all about super-science!" },
        { name: 'Hank & Dean Venture duo', category: 'Team Venture', desc: 'Go Team Venture!' },
        { name: 'Dr. Girlfriend / Dr. Mrs. The Monarch (Jackie O style)', category: 'Guild of Calamitous Intent', desc: 'Sweetie, are you arching Dr. Venture again?' },
        { name: 'The Monarch (Full Wings & Crown)', category: 'Guild of Calamitous Intent', desc: 'Feel the wrath of the Monarch!' },
        { name: 'Henchman 21 & 24 (The Two-Ton Twenty-One)', category: 'Henchmen', desc: 'Two-ton twenty-one!' },
        { name: 'Dr. Henry Killinger with Magic Murder Bag', category: 'Guild of Calamitous Intent', desc: 'I am Dr. Henry Killinger, and this is my magic murder bag.' },
        { name: 'Shore Leave (SPHINX!)', category: 'SPHINX', desc: 'Boom! Yummy! SPHINX!' },
        { name: 'Red Death (Gentleman Villain on horseback)', category: 'Guild of Calamitous Intent', desc: 'I am a creature of duty and family.' },
        { name: 'The Sovereign (David Bowie / Diamond Dogs)', category: 'Guild of Calamitous Intent', desc: "Changes... you can't trace time." },
        { name: 'Molotov Cocktease with eyepatch', category: 'Allies & Enemies', desc: 'Do not play with matches, Samson.' },
        { name: 'Action Johnny in recovery', category: 'Team Venture', desc: 'My father used to drop me out of airplanes in a box, Brock!' },
      ];

      for (let i = 0; i < sampleTargets.length; i++) {
        const item = sampleTargets[i];
        await client.execute({
          sql: 'INSERT INTO targets (id, year_id, name, description, category_tag, status, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [`target-2026-${i + 1}`, yearId, item.name, item.desc, item.category, 'NEEDED', i, now + i],
        });
      }
    }

    await client.execute({
      sql: "INSERT OR REPLACE INTO system_meta (key, value) VALUES ('seeded', 'true')",
      args: [],
    });
  }
}
