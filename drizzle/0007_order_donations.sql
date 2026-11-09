ALTER TABLE `orders` ADD `donations` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Backfill orders placed before donations existed, using the same rate rules.
UPDATE `orders` SET `donations` = CAST(ROUND((`subtotal_cents` / 100.0) * MIN(2.0, 1.2 + 0.2 * (COALESCE((SELECT SUM(`quantity`) FROM `order_items` WHERE `order_items`.`order_id` = `orders`.`id`), 1) - 1))) AS INTEGER);
