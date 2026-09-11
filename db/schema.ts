import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const contactRequests = sqliteTable('contact_requests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull().default(''),
  interest: text('interest').notNull().default(''),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});
