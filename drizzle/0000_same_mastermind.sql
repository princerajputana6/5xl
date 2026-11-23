CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text DEFAULT 'Home' NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`line1` text NOT NULL,
	`line2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`pincode` text NOT NULL,
	`country` text DEFAULT 'India' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `addresses_user_idx` ON `addresses` (`user_id`);--> statement-breakpoint
CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`logo` text,
	`is_active` integer DEFAULT true NOT NULL,
	`seo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_slug_unique` ON `brands` (`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`tagline` text,
	`image` text,
	`emoji` text,
	`parent_id` text,
	`order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`seo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_active_order_idx` ON `categories` (`is_active`,`order`);--> statement-breakpoint
CREATE TABLE `counters` (
	`id` text PRIMARY KEY NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`min_order` real DEFAULT 0 NOT NULL,
	`max_discount` real DEFAULT 0 NOT NULL,
	`usage_limit` integer DEFAULT 0 NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`starts_at` integer,
	`expires_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `coupons_active_idx` ON `coupons` (`is_active`);--> statement-breakpoint
CREATE TABLE `home_content` (
	`key` text PRIMARY KEY DEFAULT 'home' NOT NULL,
	`announcement` text,
	`hero_slides` text DEFAULT '[]' NOT NULL,
	`hero_stats` text DEFAULT '[]' NOT NULL,
	`hero_secondary_cta_label` text,
	`hero_secondary_cta_href` text,
	`features` text DEFAULT '[]' NOT NULL,
	`marquee_items` text DEFAULT '[]' NOT NULL,
	`cta` text,
	`category_section_title` text DEFAULT 'Shop by category' NOT NULL,
	`show_featured` integer DEFAULT true NOT NULL,
	`show_bestsellers` integer DEFAULT true NOT NULL,
	`featured_category_slugs` text DEFAULT '[]' NOT NULL,
	`sections` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`items` text NOT NULL,
	`amounts` text NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`coupon_code` text,
	`points_used` integer DEFAULT 0 NOT NULL,
	`address` text NOT NULL,
	`payment` text NOT NULL,
	`payment_status` text DEFAULT 'created' NOT NULL,
	`gateway_order_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`timeline` text DEFAULT '[]' NOT NULL,
	`placed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_payment_status_idx` ON `orders` (`payment_status`);--> statement-breakpoint
CREATE INDEX `orders_gateway_idx` ON `orders` (`gateway_order_id`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`content_html` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`author` text DEFAULT 'The 5XL Nutrition' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` integer,
	`reading_minutes` integer DEFAULT 1 NOT NULL,
	`seo` text,
	`source_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_status_published_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sku` text NOT NULL,
	`short_description` text,
	`description` text,
	`brand_id` text NOT NULL,
	`category_id` text NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`price` real NOT NULL,
	`mrp` real NOT NULL,
	`gst_pct` real DEFAULT 18 NOT NULL,
	`variants` text DEFAULT '[]' NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`nutrition_facts` text DEFAULT '[]' NOT NULL,
	`ingredients` text DEFAULT '[]' NOT NULL,
	`benefits` text DEFAULT '[]' NOT NULL,
	`key_benefits` text DEFAULT '[]' NOT NULL,
	`usage` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`goals` text DEFAULT '[]' NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_bestseller` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`seo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `products_brand_idx` ON `products` (`brand_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_price_idx` ON `products` (`price`);--> statement-breakpoint
CREATE INDEX `products_created_idx` ON `products` (`created_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`user_id` text NOT NULL,
	`author_name` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`is_verified_purchase` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`reply` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reviews_product_idx` ON `reviews` (`product_id`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`product_slug` text NOT NULL,
	`image` text,
	`variant_id` text,
	`variant_label` text,
	`price` real NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	`interval_days` integer DEFAULT 30 NOT NULL,
	`discount_pct` real DEFAULT 10 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`next_delivery_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subscriptions_user_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`phone_verified` integer DEFAULT false NOT NULL,
	`avatar` text,
	`wallet_balance` real DEFAULT 0 NOT NULL,
	`reward_points` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`balance_after` real NOT NULL,
	`order_number` text,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `wallet_tx_user_idx` ON `wallet_transactions` (`user_id`);--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_ids` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wishlists_user_id_unique` ON `wishlists` (`user_id`);