CREATE TABLE `contact_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`interest` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
