#!/usr/bin/env node
/**
 * Applies the RegulationUpdate and RegulationFetchLog tables to the SQLite
 * database. Prisma 7 CLI requires prisma.config.ts for migrate commands, so
 * this script applies the DDL directly via Node's built-in sqlite module.
 *
 * Run once after pulling this change: node scripts/apply-regulation-migration.js
 */

import { DatabaseSync } from "node:sqlite";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "prisma", "dev.db");

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS "RegulationUpdate" (
    "id"          TEXT      NOT NULL PRIMARY KEY,
    "category"    TEXT      NOT NULL,
    "title"       TEXT      NOT NULL,
    "summary"     TEXT      NOT NULL,
    "sourceUrl"   TEXT,
    "publishedAt" DATETIME,
    "fetchedAt"   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "RegulationFetchLog" (
    "id"          TEXT      NOT NULL PRIMARY KEY,
    "fetchedAt"   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success"     INTEGER   NOT NULL,
    "updateCount" INTEGER   NOT NULL DEFAULT 0,
    "error"       TEXT
  );
`);

db.close();

console.log("✓ RegulationUpdate and RegulationFetchLog tables created (or already exist).");
