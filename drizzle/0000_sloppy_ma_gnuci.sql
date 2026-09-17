CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`pack_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`digest` text NOT NULL,
	`issued` text NOT NULL,
	`revoked` text,
	FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_pack_id_unique` ON `certificates` (`pack_id`);--> statement-breakpoint
CREATE INDEX `certificates_owner` ON `certificates` (`owner`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`pack_id` text NOT NULL,
	`message` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_owner_created` ON `events` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `packs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`serial` text NOT NULL,
	`customer` text NOT NULL,
	`batch` text NOT NULL,
	`chemistry` text NOT NULL,
	`nominal` integer NOT NULL,
	`status` text NOT NULL,
	`test` text,
	`soh` integer,
	`grade` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `packs_owner_serial` ON `packs` (`owner`,`serial`);--> statement-breakpoint
CREATE INDEX `packs_owner_created` ON `packs` (`owner`,`created`);