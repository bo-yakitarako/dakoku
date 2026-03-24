CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	`updated_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `current_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	`updated_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `current_jobs_user_id_unique` ON `current_jobs` (`user_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	`updated_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	`updated_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	`updated_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)),
	`updated_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer))
);
--> statement-breakpoint
CREATE TABLE `work_times` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`date` integer NOT NULL,
	`index` integer NOT NULL,
	`acted_at` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	`updated_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
