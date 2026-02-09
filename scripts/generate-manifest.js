
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public/Site_Pics');
const OUTPUT_FILE = path.join(__dirname, '../public/site-manifest.json');

const CATEGORY_MAP = {
  'Top_models': 'Top Model',
  'Top_Model': 'Top Model',
  'New_Faces': 'New Faces',
  'Trending': 'Trending',
  'Visiting_models': 'Visiting',
  'Young_Talents': 'Young Talents'
};

function getImagesInFolder(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  const images = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
  
  images.sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ''));
    const numB = parseInt(b.replace(/[^0-9]/g, ''));
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });

  return images.map(file => {
    const fullPath = path.join(dir, file);
    const rel = path.relative(path.join(__dirname, '../public'), fullPath);
    return '/' + rel.replace(/\\/g, '/');
  });
}

function findFolderCaseInsensitive(baseDir, targetNames) {
  if (!fs.existsSync(baseDir)) return null;
  const items = fs.readdirSync(baseDir);
  const found = items.find(item => {
    const cleanItem = item.toLowerCase().replace(/_/g, '').replace(/ /g, '');
    return targetNames.some(t => t.toLowerCase() === cleanItem);
  });
  return found ? path.join(baseDir, found) : null;
}

const models = new Map(); // Use Map to prevent duplicates if model is in multiple categories

Object.entries(CATEGORY_MAP).forEach(([dirName, categoryName]) => {
  const categoryPath = path.join(PUBLIC_DIR, dirName);
  if (!fs.existsSync(categoryPath)) return;

  const items = fs.readdirSync(categoryPath);
  items.forEach(item => {
    const itemPath = path.join(categoryPath, item);
    if (!fs.statSync(itemPath).isDirectory()) return;

    const modelName = item.replace(/_/g, ' ');
    const modelKey = modelName.toLowerCase().trim();

    // Skip if already processed in another category (keep first one found)
    if (models.has(modelKey)) return;

    const modelpagePath = findFolderCaseInsensitive(itemPath, ['modelpage', 'model_page']);
    const pagePath = findFolderCaseInsensitive(itemPath, ['page']);
    const storyPath = findFolderCaseInsensitive(itemPath, ['story', 'stories']);
    const newestPath = findFolderCaseInsensitive(itemPath, ['newest']);

    const modelpageImages = getImagesInFolder(modelpagePath);
    const pageImages = getImagesInFolder(pagePath);
    const storyImages = getImagesInFolder(storyPath);
    const newestImages = getImagesInFolder(newestPath);

    const rootImages = fs.readdirSync(itemPath)
      .filter(f => fs.statSync(path.join(itemPath, f)).isFile() && /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => {
          const rel = path.relative(path.join(__dirname, '../public'), path.join(itemPath, f));
          return '/' + rel.replace(/\\/g, '/');
      });

    let avatar = null;
    const explicitAvatar = rootImages.find(img => img.toLowerCase().includes('avatar') || img.toLowerCase().includes('pfp'));
    if (explicitAvatar) avatar = explicitAvatar;
    else if (modelpageImages.length > 0) avatar = modelpageImages[0];
    else if (rootImages.length > 0) avatar = rootImages[0];
    else if (pageImages.length > 0) avatar = pageImages[0];

    const allImages = [...rootImages, ...modelpageImages, ...pageImages, ...newestImages, ...storyImages];

    if (allImages.length > 0) {
      models.set(modelKey, {
        name: modelName,
        category: categoryName,
        avatar: avatar,
        cover_images: modelpageImages.length > 0 ? modelpageImages : (rootImages.length > 0 ? rootImages.slice(0, 5) : [avatar]),
        posts: [...newestImages, ...pageImages],
        stories: storyImages,
        images: allImages
      });
      console.log(`[${categoryName}] ${modelName}: modelpage=${modelpageImages.length}, page=${pageImages.length}, newest=${newestImages.length}, story=${storyImages.length}`);
    }
  });
});

const sortedModels = Array.from(models.values());
const CATEGORY_PRIORITY = { 'Top Model': 1, 'Trending': 2, 'New Faces': 3, 'Young Talents': 4, 'Visiting': 5 };

sortedModels.sort((a, b) => {
  const prioA = CATEGORY_PRIORITY[a.category] || 99;
  const prioB = CATEGORY_PRIORITY[b.category] || 99;
  if (prioA !== prioB) return prioA - prioB;
  return a.name.localeCompare(b.name);
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedModels, null, 2));
console.log(`\nManifest generated! Found ${sortedModels.length} models.`);
