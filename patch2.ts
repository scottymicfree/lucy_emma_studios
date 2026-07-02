import * as fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// replace all "/tmp/..." with process.env.LUCY_DB_DIR || "/tmp/..."
// actually replace `new Database("/tmp/...`
content = content.replace(/new Database\("(\/tmp\/.*?\.db)"/g, 'new Database(path.join(process.env.LUCY_DB_DIR || "/tmp", "$1".replace("/tmp/", "")))');

fs.writeFileSync('server.ts', content);
console.log('Patched server.ts');
