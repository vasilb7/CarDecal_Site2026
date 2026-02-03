

import type { Model, Post } from '../types';

const generatePosts = (modelName: string, filenames: string[]): Post[] => {
  return filenames.map((name, index) => ({
    id: `${modelName.replace(/\s+/g, '-').toLowerCase()}-p${index}`,
    src: `/Stock Photos/${modelName}/Page/${name}`,
    type: 'image',
    caption: `Portfolio ${index + 1}`,
    tags: ['fashion', 'model'],
    pinned: index === 0,
    likes: 100 + index * 5,
    date: new Date().toISOString()
  }));
};

const generateGroupedPosts = (modelName: string, filenames: string[]): Post[] => {
  const sourceFiles = filenames;
  const posts: Post[] = [];
  let fileIndex = 0;
  let postCount = 0;
  
  // Starting date - about 2 years ago
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 24);

  while (fileIndex < sourceFiles.length) {
      const n = fileIndex;
      const pseudoRand = ((n * 9301 + 49297) % 233280) / 233280; 

      let groupSize = 1;
      if (pseudoRand > 0.70) groupSize = 2; // 20% chance
      if (pseudoRand > 0.90) groupSize = 3; // 10% chance
      
      if (fileIndex + groupSize > sourceFiles.length) {
          groupSize = sourceFiles.length - fileIndex;
      }

      const group = sourceFiles.slice(fileIndex, fileIndex + groupSize);
      const fullPaths = group.map(name => `/Stock Photos/${modelName}/Page/${name}`);
      
      // Generate a date that increases with index
      const postDate = new Date(startDate);
      postDate.setDate(postDate.getDate() + (postCount * 3)); // New post every 3 days approx

      posts.push({
          id: `${modelName.replace(/\s+/g, '-').toLowerCase()}-p${postCount}`,
          src: fullPaths[0],
          images: groupSize > 1 ? fullPaths : undefined,
          type: 'image',
          caption: `Portfolio ${postCount + 1}`,
          tags: ['fashion', 'model', 'editorial'],
          pinned: postCount === 0 || postCount === 1,
          likes: Math.floor(pseudoRand * 1000) + 50, // 50 to 1050 likes
          date: postDate.toISOString()
      });
      
      fileIndex += groupSize;
      postCount++;
  }
  return posts;
};

// Helper to generate file lists [1.jpeg, 2.jpeg, ...] with custom exceptions
const getFileList = (count: number, pngIndices: number[] = []): string[] => {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const ext = pngIndices.includes(n) ? 'png' : 'jpeg';
    return `${n}.${ext}`;
  });
};

const alexandaraFiles = getFileList(45);
const kylaFiles = getFileList(24);
const victoriaFiles = getFileList(39, [39]); // 39.png
const victoriaCardFiles = getFileList(5, [1, 2, 3, 4]); // model_page has 1-4 as png, 5 as jpeg
const lorenFiles = getFileList(6);
const pamelaFiles = getFileList(241, [17, 39, 51, 80, 123]); // 17, 39, 51, 80 are png based on previous scan

export const modelsData: Model[] = [
  {
    slug: 'pamela-nelson',
    name: 'Pamela Nelson',
    avatar: '/Stock Photos/Pamela Nelson/modelpage/1.jpeg',
    coverImage: '/Stock Photos/Pamela Nelson/modelpage/1.jpeg',
    categories: ['Editorial', 'Commercial', 'Top Model'],
    location: 'Paris',
    height: "180cm / 5'11\"",
    measurements: "86-63-92",
    hairColor: 'Dark Brown',
    eyeColor: 'Brown',
    bio: 'Pamela is a high-fashion icon.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Pamela Nelson', pamelaFiles),
    cardImages: getFileList(5).map(f => `/Stock Photos/Pamela Nelson/modelpage/${f}`),
    isTopModel: true,
    isVerified: true,
    nameBg: 'Памела Нелсън'
  },
  {
    slug: 'alexandra-white',
    name: 'Alexandra White',
    avatar: '/Stock Photos/Alexandara White/modelpage/1.jpeg',
    coverImage: '/Stock Photos/Alexandara White/modelpage/1.jpeg',
    categories: ['Editorial', 'Runway'],
    location: 'London',
    height: "178cm / 5'10\"",
    measurements: "82-60-88",
    hairColor: 'Blonde',
    eyeColor: 'Blue',
    bio: 'Alexandra is a versatile model with a strong editorial presence.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Alexandara White', alexandaraFiles),
    cardImages: getFileList(5).map(f => `/Stock Photos/Alexandara White/modelpage/${f}`),
    isVerified: true,
    nameBg: 'Александра Уайт'
  },
  {
    slug: 'kyla-gabriel',
    name: 'Kyla Gabriel',
    avatar: '/Stock Photos/Kyla Gabriel/modelpage/1.jpeg',
    coverImage: '/Stock Photos/Kyla Gabriel/modelpage/1.jpeg',
    categories: ['Commercial', 'Beauty'],
    location: 'New York',
    height: "175cm / 5'9\"",
    measurements: "84-62-90",
    hairColor: 'Brunette',
    eyeColor: 'Brown',
    bio: 'Kyla is known for her commercial appeal.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Kyla Gabriel', kylaFiles),
    cardImages: getFileList(5).map(f => `/Stock Photos/Kyla Gabriel/modelpage/${f}`),
    isVerified: true,
    nameBg: 'Кайла Габриел'
  },
  {
    slug: 'loren-torrente',
    name: 'Loren Torrente',
    avatar: '/Stock Photos/Loren Torrente/Page/1.jpeg',
    coverImage: '/Stock Photos/Loren Torrente/Page/1.jpeg',
    categories: ['Editorial', 'Fashion'],
    location: 'Milan',
    height: "177cm / 5'10\"",
    measurements: "83-61-89",
    hairColor: 'Brown',
    eyeColor: 'Green',
    bio: 'Loren is a rising star in the fashion industry.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Loren Torrente', lorenFiles),
    cardImages: getFileList(5).map(f => `/Stock Photos/Loren Torrente/Page/${f}`),
    nameBg: 'Лорен Торенте'
  },
  {
    slug: 'victoria-james',
    name: 'Victoria James',
    avatar: '/Stock Photos/Victoria James/model_page/1.png',
    coverImage: '/Stock Photos/Victoria James/model_page/1.png',
    categories: ['Editorial', 'Commercial'],
    location: 'London',
    height: "176cm / 5'9.5\"",
    measurements: "84-61-89",
    hairColor: 'Blonde',
    eyeColor: 'Brown',
    bio: 'Victoria brings a classic elegance to every shoot.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Victoria James', victoriaFiles), // generateGroupedPosts uses /Page/ path by default
    cardImages: victoriaCardFiles.map(f => `/Stock Photos/Victoria James/model_page/${f}`),
    isVerified: true,
    nameBg: 'Виктория Джеймс'
  }
];
