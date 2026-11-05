CREATE TABLE `snobi_options` (
	`id` text PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`image_key` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_worn_items` (
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `product_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`title` text,
	`snobi_option_id` text NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`session_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`snobi_option_id`) REFERENCES `snobi_options`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_idx` ON `users` (`phone`);--> statement-breakpoint
ALTER TABLE `orders` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `orders` ADD `confirmed_at` integer;--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
ALTER TABLE `products` ADD `wearable_key` text;