CREATE TYPE "public"."payout_status" AS ENUM('queued', 'proposed', 'executed', 'failed');--> statement-breakpoint
CREATE TABLE "approved_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_number" serial NOT NULL,
	"submission_id" uuid NOT NULL,
	"bounty_id" uuid,
	"payout_marlbro" numeric(30, 6) DEFAULT '0' NOT NULL,
	"payout_sol" numeric(30, 9) DEFAULT '0' NOT NULL,
	"payout_status" "payout_status" DEFAULT 'queued' NOT NULL,
	"squads_proposal_pubkey" text,
	"payout_tx_signature" text,
	"poster_og_image_url" text,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "approved_grants_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
ALTER TABLE "approved_grants" ADD CONSTRAINT "approved_grants_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_grants" ADD CONSTRAINT "approved_grants_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE no action ON UPDATE no action;