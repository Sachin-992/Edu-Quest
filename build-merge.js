import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distRoot = path.join(__dirname, 'dist');
const coreDist = path.join(__dirname, 'educore-main', 'edu-main', 'dist');
const questDist = path.join(__dirname, 'eduquest-main', 'dist');

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('🧹 Cleaning old unified dist...');
  if (fs.existsSync(distRoot)) {
    fs.rmSync(distRoot, { recursive: true, force: true });
  }

  console.log('🚀 Merging EduCore (School ERP) into dist...');
  if (fs.existsSync(coreDist)) {
    copyDirSync(coreDist, distRoot);
  } else {
    throw new Error(`EduCore build output missing at: ${coreDist}`);
  }

  console.log('🎮 Merging EduQuest (Learning Portal) into dist/quest...');
  const questDest = path.join(distRoot, 'quest');
  if (fs.existsSync(questDist)) {
    copyDirSync(questDist, questDest);
  } else {
    throw new Error(`EduQuest build output missing at: ${questDist}`);
  }

  console.log('📄 Copying vercel.json configuration...');
  const vercelSrc = path.join(__dirname, 'vercel.json');
  const vercelDest = path.join(distRoot, 'vercel.json');
  if (fs.existsSync(vercelSrc)) {
    fs.copyFileSync(vercelSrc, vercelDest);
  } else {
    console.warn('⚠️ No vercel.json found in root to copy.');
  }

  console.log('✅ Portals consolidated successfully in /dist directory!');
} catch (error) {
  console.error('❌ Consolidated build failed:', error.message);
  process.exit(1);
}
