import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "myLocation.sqlite";

const SQL_CREATE = `
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY autoincrement,
  latitude real NOT NULL,
  longitude real NOT NULL
)
`;

let db = null;

export default function openDB() {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
    // primeira vez que abrimos a conexão, tentamos criar nossa tabela
    db.withTransactionSync(() => {
      db.execSync(SQL_CREATE);
    });
  }
  return db;
}
