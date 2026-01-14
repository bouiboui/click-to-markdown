#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const green = chalk.green;
const blue = chalk.blue;
const yellow = chalk.yellow;
const red = chalk.red;

// Read version from package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const VERSION = packageJson.version;
const EXT_NAME = 'click-to-markdown';
const TAG_NAME = `v${VERSION}`;

// Check if tag already exists
try {
  execSync(`git rev-parse ${TAG_NAME}`, { stdio: 'ignore' });
  console.error(red(`Error: Tag ${TAG_NAME} already exists`));
  process.exit(1);
} catch (e) {
  // Tag doesn't exist, which is what we want
}

// Check if there are uncommitted changes
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.warn(yellow('Warning: You have uncommitted changes.'));
    console.warn(yellow('Consider committing them before creating a tag.'));
    console.log('');
  }
} catch (e) {
  console.error(red('Error: Not a git repository'));
  process.exit(1);
}

// Get commit message from command line or use default
const message = process.argv[2] || `Release ${TAG_NAME}`;

// Create annotated tag
try {
  console.log(blue(`Creating git tag: ${TAG_NAME}...`));
  execSync(`git tag -a ${TAG_NAME} -m "${message}"`, { stdio: 'inherit' });
  console.log(green(`✓ Tag ${TAG_NAME} created successfully`));
  console.log(blue(`Run 'git push origin ${TAG_NAME}' to push the tag to remote`));
} catch (error) {
  console.error(red('Error: Failed to create tag'));
  process.exit(1);
}
