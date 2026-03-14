import Database from "better-sqlite3";
import path from "node:path";
import {
	CREATE_GENERATIONS_CREATED_AT_IDX,
	CREATE_GENERATIONS_NEWS_ITEM_IDX,
	CREATE_GENERATIONS_TABLE,
	CREATE_NEWS_ITEMS_TABLE,
} from "./schema";

const DB_PATH =
	process.env.DATABASE_PATH ?? path.join(process.cwd(), "shnitzel.db");

let _db: Database.Database | null = null;

function initDb(db: Database.Database): void {
	db.pragma("journal_mode = WAL");
	db.pragma("foreign_keys = ON");
	db.exec(CREATE_NEWS_ITEMS_TABLE);
	db.exec(CREATE_GENERATIONS_TABLE);
	db.exec(CREATE_GENERATIONS_NEWS_ITEM_IDX);
	db.exec(CREATE_GENERATIONS_CREATED_AT_IDX);
}

export function getDb(): Database.Database {
	if (_db) return _db;

	_db = new Database(DB_PATH);
	initDb(_db);

	return _db;
}

/** Override the DB instance (for testing with in-memory DB). */
export function setDb(db: Database.Database): void {
	_db = db;
	initDb(_db);
}

export function closeDb(): void {
	if (_db) {
		_db.close();
		_db = null;
	}
}
