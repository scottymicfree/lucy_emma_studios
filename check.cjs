const Database = require('better-sqlite3');
const db = new Database('/tmp/emma_vr_telemetry.db', { fileMustExist: false });
const row = db.prepare("SELECT state FROM game_telemetry WHERE id='current'").get();
console.log(row ? row.state : "NO ROW");
