CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`requirement` text NOT NULL,
	`details` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_reference_unique` ON `enquiries` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_idempotency_key_unique` ON `enquiries` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `enquiry_created_index` ON `enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `enquiry_status_index` ON `enquiries` (`status`);--> statement-breakpoint
CREATE TABLE `enquiry_files` (
	`id` text PRIMARY KEY NOT NULL,
	`enquiry_id` text NOT NULL,
	`filename` text NOT NULL,
	`object_key` text NOT NULL,
	`size` integer NOT NULL,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `enquiry_file_parent_index` ON `enquiry_files` (`enquiry_id`);--> statement-breakpoint
CREATE TABLE `enquiry_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
