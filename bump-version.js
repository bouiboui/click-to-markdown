#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const green = chalk.green;
const blue = chalk.blue;
const yellow = chalk.yellow;

// Parse version string into parts
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2]
  };
}

// Increment version based on type
function incrementVersion(version, type) {
  const parsed = parseVersion(version);
  
  switch (type) {
    case 'major':
      parsed.major += 1;
      parsed.minor = 0;
      parsed.patch = 0;
      break;
    case 'minor':
      parsed.minor += 1;
      parsed.patch = 0;
      break;
    case 'patch':
      parsed.patch += 1;
      break;
    default:
      throw new Error(`Invalid version type: ${type}. Use 'major', 'minor', or 'patch'`);
  }
  
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

// Get version type from command line argument
const versionType = process.argv[2];

if (!versionType || !['major', 'minor', 'patch'].includes(versionType)) {
  console.error(yellow('Usage: npm run version:patch|minor|major'));
  console.error(yellow('   or: node bump-version.js patch|minor|major'));
  process.exit(1);
}

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const oldVersion = packageJson.version;
const newVersion = incrementVersion(oldVersion, versionType);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2) + '\n',
  'utf8'
);

console.log(blue(`Version bumped: ${oldVersion} → ${green(newVersion)}`));
console.log(blue('Run `npm run build` to sync version to manifest.json and create package'));
