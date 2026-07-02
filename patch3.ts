import * as fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace the bad format: new Database(path.join(process.env.LUCY_DB_DIR || "/tmp", "/tmp/emma_omniversal_purpose.db".replace("/tmp/", ""))), {
content = content.replace(/new Database\(path\.join\(process\.env\.LUCY_DB_DIR \|\| "\/tmp", "\/tmp\/(.*?)".replace\("\/tmp\/", ""\)\)\), {/g, 'new Database(path.join(process.env.LUCY_DB_DIR || "/tmp", "$1"), {');

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts');
