import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const enquiries = sqliteTable('enquiries', {
  id: text('id').primaryKey(), reference: text('reference').notNull().unique(),
  idempotencyKey: text('idempotency_key').notNull().unique(), createdAt: text('created_at').notNull(),
  name: text('name').notNull(), email: text('email').notNull(), phone: text('phone').notNull().default(''),
  company: text('company').notNull().default(''), requirement: text('requirement').notNull(),
  details: text('details').notNull(), status: text('status').notNull().default('new'),
}, table => [index('enquiry_created_index').on(table.createdAt), index('enquiry_status_index').on(table.status)]);
export const enquiryFiles = sqliteTable('enquiry_files', {
  id: text('id').primaryKey(), enquiryId: text('enquiry_id').notNull().references(() => enquiries.id),
  filename: text('filename').notNull(), objectKey: text('object_key').notNull(), size: integer('size').notNull(),
}, table => [index('enquiry_file_parent_index').on(table.enquiryId)]);
export const enquiryRateLimits = sqliteTable('enquiry_rate_limits', {
  key: text('key').primaryKey(), windowStart: integer('window_start').notNull(), count: integer('count').notNull(),
});
