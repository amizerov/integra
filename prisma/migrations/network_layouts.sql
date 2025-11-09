-- CreateTable
CREATE TABLE
IF NOT EXISTS "network_layouts"
(
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR
(255) NOT NULL,
    "description" TEXT,
    "user_id" INTEGER NOT NULL,
    "layout_data" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP
(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP
(6) NOT NULL,
    CONSTRAINT "network_layouts_user_id_fkey" FOREIGN KEY
("user_id") REFERENCES "allowed_users"
("user_id") ON
DELETE RESTRICT ON
UPDATE CASCADE
);
