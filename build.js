#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const blue = chalk.blue;
const green = chalk.green;

// Get the directory where the script is located
process.chdir(__dirname);

// Read version from package.json (source of truth)
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const VERSION = packageJson.version;

// Sync version to manifest.json
const manifestPath = path.join(__dirname, 'src', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.version !== VERSION) {
  console.log(blue(`Syncing version ${VERSION} to manifest.json...`));
  manifest.version = VERSION;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

// Extension name and output file
const EXT_NAME = 'click-to-markdown';
const OUTPUT_FILE = `${EXT_NAME}-v${VERSION}.zip`;
const releasesDir = path.join(__dirname, 'releases');
const OUTPUT_PATH = path.join(releasesDir, OUTPUT_FILE);

console.log(blue('Packaging Click to Markdown extension...'));

// Create releases directory if it doesn't exist
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

// Remove existing zip if it exists
if (fs.existsSync(OUTPUT_PATH)) {
  console.log(`Removing existing package: ${OUTPUT_FILE}`);
  fs.unlinkSync(OUTPUT_PATH);
}

// Clean and create dist directory
console.log('Copying files from src/ to dist/...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Copy all files from src/ to dist/
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyRecursive(srcPath, destPath);
    }
  } else {
    // Skip .DS_Store and other unwanted files
    const basename = path.basename(src);
    if (basename === '.DS_Store' || basename.endsWith('.zip')) {
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(path.join(__dirname, 'src'), distPath);

// Create the zip file from dist directory
(async () => {
  await new Promise((resolve, reject) => {
  const output = fs.createWriteStream(OUTPUT_PATH);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
  });

  // Listen for all archive data to be written
  output.on('close', () => {
    const fileSize = (archive.pointer() / 1024).toFixed(2);
    console.log(green(`✓ Package created successfully: ${OUTPUT_FILE}`));
    console.log(blue(`File location: releases/${OUTPUT_FILE}`));
    console.log(blue(`File size: ${fileSize} KB`));
    console.log(blue('Ready for store submission!'));
    resolve();
  });

  // Catch warnings (e.g. stat failures and other non-blocking errors)
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      reject(err);
    }
  });

  // Catch errors
  archive.on('error', (err) => {
    console.error('Error: Failed to create package');
    reject(err);
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // Add files from dist directory, excluding unwanted files
  archive.glob('**/*', {
    cwd: distPath,
    ignore: ['**/.DS_Store', '**/.git/**', '**/.gitignore', '**/*.zip']
  });

  // Finalize the archive
  archive.finalize();
  });
})().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
