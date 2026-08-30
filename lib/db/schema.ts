import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Years / Sessions
export const years = sqliteTable('years', {
  id: text('id').primaryKey(),
  year: integer('year').notNull().unique(), // e.g., 2026
  title: text('title').notNull(),          // e.g., "DragonCon 2026 Hunt"
  joinCode: text('join_code').notNull(),   // e.g., "VENTURE26"
  requiredTargets: integer('required_targets'), // Optional target goal subset (e.g. 15 out of 50)
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Target Cosplay Checklist Items
export const targets = sqliteTable('targets', {
  id: text('id').primaryKey(),
  yearId: text('year_id').notNull().references(() => years.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),             // e.g., "Brock Samson in speedo"
  description: text('description'),         // e.g., "Usually near the pool or Hyatt"
  categoryTag: text('category_tag'),        // e.g., "Team Venture", "Guild", "Henchmen"
  status: text('status', { enum: ['NEEDED', 'FOUND'] }).default('NEEDED').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Photo Sighting Submissions
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  targetId: text('target_id').notNull().references(() => targets.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  photographerName: text('photographer_name'), // e.g., "Hank"
  caption: text('caption'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Year = typeof years.$inferSelect;
export type NewYear = typeof years.$inferInsert;

export type Target = typeof targets.$inferSelect;
export type NewTarget = typeof targets.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
