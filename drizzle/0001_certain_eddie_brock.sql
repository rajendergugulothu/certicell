CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`pack_id` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`digest` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_object_key_unique` ON `reports` (`object_key`);--> statement-breakpoint
CREATE INDEX `reports_owner_pack` ON `reports` (`owner`,`pack_id`);