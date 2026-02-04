

import type { Model, Post } from '../types';

const generatePosts = (modelName: string, filenames: string[]): Post[] => {
  return filenames.map((name, index) => ({
    id: `${modelName.replace(/\s+/g, '-').toLowerCase()}-p${index}`,
    src: `/Site_Pics/${modelName}/Page/${name}`,
    type: 'image',
    caption: `Portfolio ${index + 1}`,
    tags: ['fashion', 'model'],
    pinned: index === 0,
    likes: 100 + index * 5,
    date: new Date().toISOString()
  }));
};

const generateGroupedPosts = (modelName: string, filenames: string[], categoryFolder?: string): Post[] => {
  const sourceFiles = filenames;
  const posts: Post[] = [];
  let fileIndex = 0;
  let postCount = 0;
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 24);

  while (fileIndex < sourceFiles.length) {
      const n = fileIndex;
      const pseudoRand = ((n * 9301 + 49297) % 233280) / 233280; 

      let groupSize = 1;
      if (pseudoRand > 0.70) groupSize = 2;
      if (pseudoRand > 0.90) groupSize = 3;
      
      if (fileIndex + groupSize > sourceFiles.length) {
          groupSize = sourceFiles.length - fileIndex;
      }

      const categoryPath = categoryFolder ? `${categoryFolder}/${modelName}` : modelName;
      const group = sourceFiles.slice(fileIndex, fileIndex + groupSize);
      const fullPaths = group.map(name => `/Site_Pics/${categoryPath}/Page/${name}`);
      
      const postDate = new Date(startDate);
      postDate.setDate(postDate.getDate() + (postCount * 3));

      posts.push({
          id: `${modelName.replace(/\s+/g, '-').toLowerCase()}-p${postCount}`,
          src: fullPaths[0],
          images: groupSize > 1 ? fullPaths : undefined,
          type: 'image',
          caption: `Portfolio ${postCount + 1}`,
          tags: ['fashion', 'model', 'editorial'],
          pinned: postCount === 0 || postCount === 1,
          likes: Math.floor(pseudoRand * 1000) + 50,
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
    avatar: '/Site_Pics/Top_models/Pamela Nelson/modelpage/1.jpeg',
    coverImage: '/Site_Pics/Top_models/Pamela Nelson/modelpage/1.jpeg',
    categories: ['Editorial', 'Commercial', 'Top Model'],
    location: 'Paris',
    height: "180cm / 5'11\"",
    measurements: "86-63-92",
    hairColor: 'Dark Brown',
    eyeColor: 'Brown',
    bio: 'Pamela is a high-fashion icon.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Pamela Nelson', pamelaFiles, 'Top_models'),
    cardImages: getFileList(5).map(f => `/Site_Pics/Top_models/Pamela Nelson/modelpage/${f}`),
    isTopModel: true,
    isVerified: true,
    nameBg: 'Памела Нелсън'
  },
  {
    slug: 'alexandra-white',
    name: 'Alexandra White',
    avatar: '/Site_Pics/New_Faces/Alexandara White/modelpage/1.jpeg',
    coverImage: '/Site_Pics/New_Faces/Alexandara White/modelpage/1.jpeg',
    categories: ['Editorial', 'Runway', 'New Faces'],
    location: 'London',
    height: "178cm / 5'10\"",
    measurements: "82-60-88",
    hairColor: 'Blonde',
    eyeColor: 'Blue',
    bio: 'Alexandra is a versatile model with a strong editorial presence.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Alexandara White', alexandaraFiles, 'New_Faces'),
    cardImages: getFileList(5).map(f => `/Site_Pics/New_Faces/Alexandara White/modelpage/${f}`),
    isVerified: true,
    nameBg: 'Александра Уайт'
  },
  {
    slug: 'kyla-gabriel',
    name: 'Kyla Gabriel',
    avatar: '/Site_Pics/New_Faces/Kyla Gabriel/modelpage/1.jpeg',
    coverImage: '/Site_Pics/New_Faces/Kyla Gabriel/modelpage/1.jpeg',
    categories: ['Commercial', 'Beauty', 'New Faces'],
    location: 'New York',
    height: "175cm / 5'9\"",
    measurements: "84-62-90",
    hairColor: 'Brunette',
    eyeColor: 'Brown',
    bio: 'Kyla is known for her commercial appeal.',
    availability: 'Booked',
    highlights: [],
    posts: generateGroupedPosts('Kyla Gabriel', kylaFiles, 'New_Faces'),
    cardImages: getFileList(5).map(f => `/Site_Pics/New_Faces/Kyla Gabriel/modelpage/${f}`),
    isVerified: true,
    nameBg: 'Кайла Габриел'
  },
  {
    slug: 'loren-torrente',
    name: 'Loren Torrente',
    avatar: '/Site_Pics/New_Faces/Loren Torrente/Page/1.jpeg',
    coverImage: '/Site_Pics/New_Faces/Loren Torrente/Page/1.jpeg',
    categories: ['Editorial', 'Fashion', 'New Faces'],
    location: 'Milan',
    height: "177cm / 5'10\"",
    measurements: "83-61-89",
    hairColor: 'Brown',
    eyeColor: 'Green',
    bio: 'Loren is a rising star in the fashion industry.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Loren Torrente', lorenFiles, 'New_Faces'),
    cardImages: getFileList(5).map(f => `/Site_Pics/New_Faces/Loren Torrente/Page/${f}`),
    nameBg: 'Лорен Торенте'
  },
  {
    slug: 'victoria-james',
    name: 'Victoria James',
    avatar: '/Site_Pics/Trending/Victoria James/model_page/1.png',
    coverImage: '/Site_Pics/Trending/Victoria James/model_page/1.png',
    categories: ['Editorial', 'Commercial', 'Trending'],
    location: 'London',
    height: "176cm / 5'9.5\"",
    measurements: "84-61-89",
    hairColor: 'Blonde',
    eyeColor: 'Brown',
    bio: 'Victoria brings a classic elegance to every shoot.',
    availability: 'Booked',
    highlights: [],
    posts: generateGroupedPosts('Victoria James', victoriaFiles, 'Trending'),
    cardImages: victoriaCardFiles.map(f => `/Site_Pics/Trending/Victoria James/model_page/${f}`),
    isVerified: true,
    nameBg: 'Виктория Джеймс'
  },
  {
    slug: 'paula-young',
    name: 'Paula Young',
    nameBg: 'Паула Йънг',
    avatar: '/Site_Pics/Visiting_models/Paula Young/pfp.jpeg',
    coverImage: '/Site_Pics/Visiting_models/Paula Young/pfp.jpeg',
    categories: ['Commercial', 'Visiting'],
    location: 'Berlin',
    height: "174cm / 5'8.5\"",
    measurements: "83-60-88",
    hairColor: 'Blonde',
    eyeColor: 'Blue',
    bio: 'Paula is a visiting model with a fresh and vibrant look, bringing international experience to our agency.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Paula Young', ['1.jpeg', '2.jpeg', '3.jpeg'], 'Visiting_models'),
    cardImages: ['1.jpeg', '2.jpeg', '3.jpeg'].map(f => `/Site_Pics/Visiting_models/Paula Young/${f}`),
    isVerified: true
  }
];
