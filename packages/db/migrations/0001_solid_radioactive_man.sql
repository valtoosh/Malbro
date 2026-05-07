CREATE TYPE "public"."lane" AS ENUM('bounty', 'open');--> statement-breakpoint
CREATE TYPE "public"."rate_limit_kind" AS ENUM('submission', 'approval');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'verifying', 'review_ready', 'approved', 'rejected', 'expired', 'flagged');--> statement-breakpoint
CREATE TABLE "bounty_claims_lock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"locked_until" timestamp with time zone NOT NULL,
	CONSTRAINT "bounty_claims_lock_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"kind" "rate_limit_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts_seen" (
	"receipt_hash" text PRIMARY KEY NOT NULL,
	"first_submission_id" uuid,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_uid" text NOT NULL,
	"lane" "lane" NOT NULL,
	"bounty_id" uuid,
	"applicant_twitter_handle" text NOT NULL,
	"applicant_twitter_id" text NOT NULL,
	"applicant_wallet_address" text NOT NULL,
	"tweet_url" text NOT NULL,
	"tweet_id" text NOT NULL,
	"tweet_verified_at" timestamp with time zone,
	"tweet_verification_payload" jsonb,
	"receipt_image_r2_key" text NOT NULL,
	"receipt_hash" text NOT NULL,
	"ip_hash" text,
	"notes" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_public_uid_unique" UNIQUE("public_uid")
);
--> statement-breakpoint
CREATE TABLE "twitter_accounts" (
	"twitter_id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"email" text,
	"access_token_enc" text,
	"refresh_token_enc" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bounty_claims_lock" ADD CONSTRAINT "bounty_claims_lock_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_claims_lock" ADD CONSTRAINT "bounty_claims_lock_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts_seen" ADD CONSTRAINT "receipts_seen_first_submission_id_submissions_id_fk" FOREIGN KEY ("first_submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;