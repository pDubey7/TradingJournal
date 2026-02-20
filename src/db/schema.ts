import { pgTable, text, timestamp, numeric, uuid, jsonb, index, boolean, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const platformEnum = pgEnum('platform', ['SOLANA_DEX', 'EVM_DEX', 'CEX']);
export const sideEnum = pgEnum('side', ['BUY', 'SELL', 'LONG', 'SHORT']); // Merged Side/Direction
export const instrumentTypeEnum = pgEnum('instrument_type', ['SPOT', 'PERP', 'OPTION']);
export const orderTypeEnum = pgEnum('order_type', ['MARKET', 'LIMIT', 'STOP', 'LIQUIDATION']);
export const positionStatusEnum = pgEnum('position_status', ['OPEN', 'CLOSED', 'LIQUIDATED']);
export const emotionEnum = pgEnum('emotion', ['CONFIDENT', 'NEUTRAL', 'ANXIOUS', 'GREEDY', 'REVENGE', 'FOMO']);

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  email: text('email').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  preferences: jsonb('preferences'),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  tags: many(tags),
}));

// Accounts (Wallets / Subaccounts)
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  platform: platformEnum('platform').default('SOLANA_DEX'),
}, (t) => ({
  userAddressIdx: unique().on(t.userId, t.address),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  executions: many(executions),
  positions: many(positions),
  snapshots: many(snapshots),
}));

// Positions (Aggregated State)
export const positions = pgTable('positions', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),

  symbol: text('symbol').notNull(),
  status: positionStatusEnum('status').default('OPEN').notNull(),
  side: sideEnum('side').notNull(),

  openedAt: timestamp('opened_at').notNull(),
  closedAt: timestamp('closed_at'),

  // Precomputed Metrics
  avgEntryPrice: numeric('avg_entry_price', { precision: 20, scale: 10 }).notNull(),
  avgExitPrice: numeric('avg_exit_price', { precision: 20, scale: 10 }),
  maxSize: numeric('max_size', { precision: 20, scale: 10 }).notNull(),

  totalVolume: numeric('total_volume', { precision: 20, scale: 10 }).notNull(),
  totalFees: numeric('total_fees', { precision: 20, scale: 10 }).notNull(),
  realizedPnL: numeric('realized_pnl', { precision: 20, scale: 10 }),

  holdingPeriodSeconds: numeric('holding_period_seconds'),
  rMultiple: numeric('r_multiple', { precision: 10, scale: 2 }),
}, (t) => ({
  accountStatusTimeIdx: index('idx_positions_account_status_time').on(t.accountId, t.status, t.openedAt),
  symbolIdx: index('idx_positions_symbol').on(t.symbol),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  account: one(accounts, { fields: [positions.accountId], references: [accounts.id] }),
  executions: many(executions),
  notes: many(journalEntries),
  tags: many(positionTags),
}));

// Executions (Raw Ledger)
export const executions = pgTable('executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  positionId: uuid('position_id').references(() => positions.id),

  sig: text('sig').notNull(), // Signature / TxHash
  blockTime: timestamp('block_time').notNull(),
  symbol: text('symbol').notNull(),

  side: sideEnum('side').notNull(),
  type: instrumentTypeEnum('type').default('PERP'),

  price: numeric('price', { precision: 20, scale: 10 }).notNull(),
  size: numeric('size', { precision: 20, scale: 10 }).notNull(),
  notional: numeric('notional', { precision: 20, scale: 10 }).notNull(),

  fee: numeric('fee', { precision: 20, scale: 10 }).notNull(),
  feeAsset: text('fee_asset').default('USDC'),
  isMaker: boolean('is_maker').default(false),

  orderType: orderTypeEnum('order_type').default('MARKET'),
  rawJson: jsonb('raw_json'),
}, (t) => ({
  accountTimeIdx: index('idx_executions_account_time').on(t.accountId, t.blockTime),
  symbolIdx: index('idx_executions_symbol').on(t.symbol),
  sigIdx: index('idx_executions_sig').on(t.sig),
}));

export const executionsRelations = relations(executions, ({ one }) => ({
  account: one(accounts, { fields: [executions.accountId], references: [accounts.id] }),
  position: one(positions, { fields: [executions.positionId], references: [positions.id] }),
}));

// Journaling
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  positionId: uuid('position_id').references(() => positions.id).notNull(),

  content: text('content').notNull(),
  richContent: jsonb('rich_content'),

  emotion: emotionEnum('emotion'),
  setupType: text('setup_type'),
  mistake: text('mistake'),
  rating: numeric('rating'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  position: one(positions, { fields: [journalEntries.positionId], references: [positions.id] }),
}));

// Tags
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  color: text('color'),
}, (t) => ({
  userTagName: unique().on(t.userId, t.name),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  positions: many(positionTags),
}));

// Many-to-Many Position Tags
export const positionTags = pgTable('position_tags', {
  positionId: uuid('position_id').references(() => positions.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
}, (t) => ({
  pk: unique().on(t.positionId, t.tagId), // Composite PK simulated
  // Real composite PK:  pk: primaryKey({ columns: [t.positionId, t.tagId] }),
}));

export const positionTagsRelations = relations(positionTags, ({ one }) => ({
  position: one(positions, { fields: [positionTags.positionId], references: [positions.id] }),
  tag: one(tags, { fields: [positionTags.tagId], references: [tags.id] }),
}));

// Snapshots
export const snapshots = pgTable('snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  timestamp: timestamp('timestamp').notNull(),

  equity: numeric('equity', { precision: 20, scale: 10 }).notNull(),
  availableBal: numeric('available_bal', { precision: 20, scale: 10 }).notNull(),

  dayPnL: numeric('day_pnl', { precision: 20, scale: 10 }).notNull(),
  dayVolume: numeric('day_volume', { precision: 20, scale: 10 }).notNull(),
}, (t) => ({
  accountTimeUnique: unique().on(t.accountId, t.timestamp),
}));

export const snapshotsRelations = relations(snapshots, ({ one }) => ({
  account: one(accounts, { fields: [snapshots.accountId], references: [accounts.id] }),
}));

// Onchain Trades (Live Devnet Sync)
export const onchainTrades = pgTable('onchain_trades', {
  id: uuid('id').defaultRandom().primaryKey(),
  wallet: text('wallet').notNull(),
  signature: text('signature').notNull().unique(),
  timestamp: timestamp('timestamp').notNull(),
  fee: numeric('fee', { precision: 20, scale: 10 }).notNull(),
  pnlEstimate: numeric('pnl_estimate', { precision: 20, scale: 10 }).notNull(),
  direction: text('direction'),
  source: text('source').notNull().default('devnet-live'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  walletIdx: index('idx_onchain_trades_wallet').on(t.wallet),
  signatureIdx: index('idx_onchain_trades_signature').on(t.signature),
}));
