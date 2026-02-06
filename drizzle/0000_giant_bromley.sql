CREATE TYPE "public"."emotion" AS ENUM('CONFIDENT', 'NEUTRAL', 'ANXIOUS', 'GREEDY', 'REVENGE', 'FOMO');--> statement-breakpoint
CREATE TYPE "public"."instrument_type" AS ENUM('SPOT', 'PERP', 'OPTION');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('MARKET', 'LIMIT', 'STOP', 'LIQUIDATION');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('SOLANA_DEX', 'EVM_DEX', 'CEX');--> statement-breakpoint
CREATE TYPE "public"."position_status" AS ENUM('OPEN', 'CLOSED', 'LIQUIDATED');--> statement-breakpoint
CREATE TYPE "public"."side" AS ENUM('BUY', 'SELL', 'LONG', 'SHORT');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"platform" "platform" DEFAULT 'SOLANA_DEX',
	CONSTRAINT "accounts_user_id_address_unique" UNIQUE("user_id","address")
);
--> statement-breakpoint
CREATE TABLE "executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"position_id" uuid,
	"sig" text NOT NULL,
	"block_time" timestamp NOT NULL,
	"symbol" text NOT NULL,
	"side" "side" NOT NULL,
	"type" "instrument_type" DEFAULT 'PERP',
	"price" numeric(20, 10) NOT NULL,
	"size" numeric(20, 10) NOT NULL,
	"notional" numeric(20, 10) NOT NULL,
	"fee" numeric(20, 10) NOT NULL,
	"fee_asset" text DEFAULT 'USDC',
	"is_maker" boolean DEFAULT false,
	"order_type" "order_type" DEFAULT 'MARKET',
	"raw_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" uuid NOT NULL,
	"content" text NOT NULL,
	"rich_content" jsonb,
	"emotion" "emotion",
	"setup_type" text,
	"mistake" text,
	"rating" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_tags" (
	"position_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "position_tags_position_id_tag_id_unique" UNIQUE("position_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"status" "position_status" DEFAULT 'OPEN' NOT NULL,
	"side" "side" NOT NULL,
	"opened_at" timestamp NOT NULL,
	"closed_at" timestamp,
	"avg_entry_price" numeric(20, 10) NOT NULL,
	"avg_exit_price" numeric(20, 10),
	"max_size" numeric(20, 10) NOT NULL,
	"total_volume" numeric(20, 10) NOT NULL,
	"total_fees" numeric(20, 10) NOT NULL,
	"realized_pnl" numeric(20, 10),
	"holding_period_seconds" numeric,
	"r_multiple" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"equity" numeric(20, 10) NOT NULL,
	"available_bal" numeric(20, 10) NOT NULL,
	"day_pnl" numeric(20, 10) NOT NULL,
	"day_volume" numeric(20, 10) NOT NULL,
	CONSTRAINT "snapshots_account_id_timestamp_unique" UNIQUE("account_id","timestamp")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	CONSTRAINT "tags_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"preferences" jsonb,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_tags" ADD CONSTRAINT "position_tags_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_tags" ADD CONSTRAINT "position_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_executions_account_time" ON "executions" USING btree ("account_id","block_time");--> statement-breakpoint
CREATE INDEX "idx_executions_symbol" ON "executions" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_executions_sig" ON "executions" USING btree ("sig");--> statement-breakpoint
CREATE INDEX "idx_positions_account_status_time" ON "positions" USING btree ("account_id","status","opened_at");--> statement-breakpoint
CREATE INDEX "idx_positions_symbol" ON "positions" USING btree ("symbol");