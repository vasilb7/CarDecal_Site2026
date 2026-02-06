import type { Model, Post } from "../types";

const generatePosts = (modelName: string, filenames: string[]): Post[] => {
  return filenames.map((name, index) => ({
    id: `${modelName.replace(/\s+/g, "-").toLowerCase()}-p${index}`,
    src: `/Site_Pics/${modelName}/Page/${name}`,
    type: "image",
    caption: `Portfolio ${index + 1}`,
    tags: ["fashion", "model"],
    pinned: index === 0,
    likes: 100 + index * 5,
    date: new Date().toISOString(),
  }));
};

const generateGroupedPosts = (
  modelName: string,
  filenames: string[],
  categoryFolder?: string,
): Post[] => {
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
    if (pseudoRand > 0.7) groupSize = 2;
    if (pseudoRand > 0.9) groupSize = 3;

    if (fileIndex + groupSize > sourceFiles.length) {
      groupSize = sourceFiles.length - fileIndex;
    }

    const categoryPath = categoryFolder
      ? `${categoryFolder}/${modelName}`
      : modelName;
    const group = sourceFiles.slice(fileIndex, fileIndex + groupSize);
    const fullPaths = group.map(
      (name) => `/Site_Pics/${categoryPath}/Page/${name}`,
    );

    const postDate = new Date(startDate);
    postDate.setDate(postDate.getDate() + postCount * 3);

    posts.push({
      id: `${modelName.replace(/\s+/g, "-").toLowerCase()}-p${postCount}`,
      src: fullPaths[0],
      images: groupSize > 1 ? fullPaths : undefined,
      type: "image",
      caption: `Portfolio ${postCount + 1}`,
      tags: ["fashion", "model", "editorial"],
      pinned: postCount === 0 || postCount === 1,
      likes: Math.floor(pseudoRand * 1000) + 50,
      date: postDate.toISOString(),
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
    const ext = pngIndices.includes(n) ? "png" : "jpeg";
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
    slug: "pamela-nelson",
    name: "Pamela Nelson",
    avatar: "/Site_Pics/Top_models/Pamela Nelson/modelpage/1.jpeg",
    coverImage: "/Site_Pics/Top_models/Pamela Nelson/modelpage/1.jpeg",
    categories: ["Editorial", "Commercial", "Top Model"],
    location: "Paris",
    height: "180cm / 5'11\"",
    measurements: "86-63-92",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    bio: "Pamela is a high-fashion icon.",
    availability: "Available",
    highlights: [],
    posts: generateGroupedPosts("Pamela Nelson", pamelaFiles, "Top_models"),
    cardImages: getFileList(5).map(
      (f) => `/Site_Pics/Top_models/Pamela Nelson/modelpage/${f}`,
    ),
    isTopModel: true,
    isVerified: true,
    nameBg: "Памела Нелсън",
  },
  {
    slug: "alexandra-white",
    name: "Alexandra White",
    avatar: "/Site_Pics/New_Faces/Alexandara White/modelpage/1.jpeg",
    coverImage: "/Site_Pics/New_Faces/Alexandara White/modelpage/1.jpeg",
    categories: ["Editorial", "Runway", "New Faces"],
    location: "London",
    height: "178cm / 5'10\"",
    measurements: "82-60-88",
    hairColor: "Blonde",
    eyeColor: "Blue",
    bio: "Alexandra is a versatile model with a strong editorial presence.",
    availability: "Available",
    highlights: [],
    posts: generateGroupedPosts(
      "Alexandara White",
      alexandaraFiles,
      "New_Faces",
    ),
    cardImages: getFileList(5).map(
      (f) => `/Site_Pics/New_Faces/Alexandara White/modelpage/${f}`,
    ),
    nameBg: "Александра Уайт",
  },
  {
    slug: "kyla-gabriel",
    name: "Kyla Gabriel",
    avatar: "/Site_Pics/New_Faces/Kyla Gabriel/modelpage/1.jpeg",
    coverImage: "/Site_Pics/New_Faces/Kyla Gabriel/modelpage/1.jpeg",
    categories: ["Commercial", "Beauty", "New Faces"],
    location: "New York",
    height: "175cm / 5'9\"",
    measurements: "84-62-90",
    hairColor: "Brunette",
    eyeColor: "Brown",
    bio: "Kyla is known for her commercial appeal.",
    availability: "Booked",
    highlights: [],
    posts: generateGroupedPosts("Kyla Gabriel", kylaFiles, "New_Faces"),
    cardImages: getFileList(5).map(
      (f) => `/Site_Pics/New_Faces/Kyla Gabriel/modelpage/${f}`,
    ),
    nameBg: "Кайла Габриел",
  },
  {
    slug: "loren-torrente",
    name: "Loren Torrente",
    avatar: "/Site_Pics/New_Faces/Loren Torrente/Page/1.jpeg",
    coverImage: "/Site_Pics/New_Faces/Loren Torrente/Page/1.jpeg",
    categories: ["Editorial", "Fashion", "New Faces"],
    location: "Milan",
    height: "177cm / 5'10\"",
    measurements: "83-61-89",
    hairColor: "Brown",
    eyeColor: "Green",
    bio: "Loren is a rising star in the fashion industry.",
    availability: "Available",
    highlights: [],
    posts: generateGroupedPosts("Loren Torrente", lorenFiles, "New_Faces"),
    cardImages: getFileList(5).map(
      (f) => `/Site_Pics/New_Faces/Loren Torrente/Page/${f}`,
    ),
    nameBg: "Лорен Торенте",
  },
  {
    slug: "victoria-james",
    name: "Victoria James",
    avatar: "/Site_Pics/Trending/Victoria James/model_page/1.png",
    coverImage: "/Site_Pics/Trending/Victoria James/model_page/1.png",
    categories: ["Editorial", "Commercial", "Trending"],
    location: "London",
    height: "176cm / 5'9.5\"",
    measurements: "84-61-89",
    hairColor: "Blonde",
    eyeColor: "Brown",
    bio: "Victoria brings a classic elegance to every shoot.",
    availability: "Booked",
    highlights: [],
    posts: generateGroupedPosts("Victoria James", victoriaFiles, "Trending"),
    cardImages: victoriaCardFiles.map(
      (f) => `/Site_Pics/Trending/Victoria James/model_page/${f}`,
    ),
    isVerified: true,
    nameBg: "Виктория Джеймс",
  },
  {
    slug: "paula-young",
    name: "Paula Young",
    nameBg: "Паула Йънг",
    avatar: "/Site_Pics/Visiting_models/Paula Young/pfp.jpeg",
    coverImage: "/Site_Pics/Visiting_models/Paula Young/pfp.jpeg",
    categories: ["Commercial", "Visiting"],
    location: "Berlin",
    height: "174cm / 5'8.5\"",
    measurements: "83-60-88",
    hairColor: "Blonde",
    eyeColor: "Blue",
    bio: "Paula is a visiting model with a fresh and vibrant look, bringing international experience to our agency.",
    availability: "Available",
    highlights: [],
    posts: generateGroupedPosts(
      "Paula Young",
      ["1.jpeg", "2.jpeg", "3.jpeg"],
      "Visiting_models",
    ),
    cardImages: ["1.jpeg", "2.jpeg", "3.jpeg"].map(
      (f) => `/Site_Pics/Visiting_models/Paula Young/${f}`,
    ),
  },
  {
    slug: "camila-lopez",
    name: "Camila Lopez",
    nameBg: "Камила Лопес",
    avatar:
      "/Site_Pics/Young_Talents/Camila_Lopez/pfp/Camila.jpeg",
    coverImage:
      "/Site_Pics/Young_Talents/Camila_Lopez/modelpage/Whisk_1d96a66646eca43af3a40879835f72badr.jpeg",
    categories: ["Editorial", "Commercial", "Young Talents"],
    location: "Sofia",
    height: "172cm / 5'7.5\"",
    measurements: "86-62-90",
    hairColor: "Dark Brown",
    eyeColor: "Dark Brown",
    bio: "Camila is a Latin American high fashion and commercial model, currently based in Sofia. She possesses an elegant and modern look, suitable for beauty, fashion and lifestyle campaigns. She has a strong presence in front of the camera and is suitable for both national and international markets.",
    availability: "Available",
    highlights: [],
    posts: generateGroupedPosts(
      "Camila_Lopez",
      [
        "Whisk_02a79c09daab8dca5b1495255bc92753dr.jpeg",
        "Whisk_037f1fab7cfdd15907f43d0c7a6866cbdr.jpeg",
        "Whisk_0648134c8c356c69a16401834e0694d0dr.jpeg",
        "Whisk_095c3296faf5d709bce4ffee93d10345dr.jpeg",
        "Whisk_09b27d6468dbb6bae9f48f5331818f8adr.jpeg",
        "Whisk_09ff98141bea6e0b2e1498820154eee7dr.jpeg",
        "Whisk_0abe9e627a24af2aabf49c6d42c6ad7bdr.jpeg",
        "Whisk_0afb5224fdae8de8fca43060ef3ba906dr.jpeg",
        "Whisk_0d810817f7a605c97584a90b7fab4c12dr.jpeg",
        "Whisk_0e311210cb4eb7eb44e4bfd70c1048dbdr.jpeg",
        "Whisk_0f3db0650307f61bd2d4d6faab54f259dr.jpeg",
        "Whisk_13305a8baf24fd7b99d4ce47e5e99f32dr.jpeg",
        "Whisk_147b2a9ec94ae96aa7f45f984fac250fdr.jpeg",
        "Whisk_15b0fe85746122fab8b4bbc097e395a4dr.jpeg",
        "Whisk_167f4dbaf1c2b9cbf004dc27daed3a4fdr.jpeg",
        "Whisk_18d363d6c33f4719a4046e83f7d4a23cdr.jpeg",
        "Whisk_1963f453b5e96a0a6d74ac68fc4f7343dr.jpeg",
        "Whisk_1ad0900f51ca638aea7475706dc3e800dr.jpeg",
        "Whisk_1be640f843ca82e98d74a51c9bcb68f8dr.jpeg",
        "Whisk_1d356dcab96ee51b8164c18b3369a31bdr.jpeg",
      ],
      "Young_Talents",
    ),
    cardImages: [
      "Whisk_1d96a66646eca43af3a40879835f72badr.jpeg",
      "Whisk_5c9d948f689aea497f64883498de3ea1dr.jpeg",
      "Whisk_7c6facb86c99456b1064f8d955852e46dr.jpeg",
      "Whisk_8ecee48da90b73592e1496d210d8335adr.jpeg",
      "Whisk_fbcd54fdacd3223a00546165de2bff4cdr.jpeg",
    ].map((f) => `/Site_Pics/Young_Talents/Camila_Lopez/modelpage/${f}`),
    isVerified: true,
  },
];
