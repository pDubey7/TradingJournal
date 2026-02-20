CREATE TABLE "onchain_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet" text NOT NULL,
	"signature" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"fee" numeric(20, 10) NOT NULL,
	"pnl_estimate" numeric(20, 10) NOT NULL,
	"direction" text,
	"source" text DEFAULT 'devnet-live' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onchain_trades_signature_unique" UNIQUE("signature")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_address" text NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_onchain_trades_wallet" ON "onchain_trades" USING btree ("wallet");--> statement-breakpoint
CREATE INDEX "idx_onchain_trades_signature" ON "onchain_trades" USING btree ("signature");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address");