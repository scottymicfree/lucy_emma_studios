import * as fs from 'fs';
import * as path from 'path';

function getFiles(dir: string): string[] {
  let files: string[] = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const pyFiles = getFiles('emma-core').filter(f => f.endsWith('.py'));
for (const file of pyFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('/tmp/')) {
    content = content.replace(/['"]\/tmp\/(.*?)['"]/g, 'os.path.join(os.environ.get("LUCY_DB_DIR", "/tmp"), "$1")');
    if (!content.includes('import os')) {
      content = 'import os\n' + content;
    }
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
