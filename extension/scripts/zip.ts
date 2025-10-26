import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');
const outputPath = path.resolve(__dirname, '../extension.zip');

if (!fs.existsSync(distPath)) {
  console.error('Error: dist directory not found. Please run build first.');
  process.exit(1);
}

if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
  console.log('Removed existing extension.zip');
}

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✓ Extension packaged successfully!`);
  console.log(`  File: ${outputPath}`);
  console.log(`  Size: ${sizeInMB} MB`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(distPath, false);
archive.finalize();
