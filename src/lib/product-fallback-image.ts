const FALLBACKS: { test: RegExp; urls: string[] }[] = [
  {
    test: /creatine/i,
    urls: [
      "https://images.unsplash.com/photo-1693996045435-af7c48b9cafb",
      "https://images.unsplash.com/photo-1683394572742-1e471f60fc2a",
      "https://images.unsplash.com/photo-1693996046514-0406d0773a7d",
      "https://images.unsplash.com/photo-1693996045463-6ea86d10a2e7",
      "https://images.unsplash.com/photo-1683394305929-5e7c8d942127",
      "https://images.unsplash.com/photo-1724160167551-2ffc3d7ca809",
      "https://images.unsplash.com/photo-1693996046147-df51fcf78ebc",
      "https://images.unsplash.com/photo-1724160167630-a33086ddb552",
    ],
  },
  {
    test: /mass gainer|weight gainer/i,
    urls: [
      "https://images.unsplash.com/photo-1709976142749-4a83767c4228",
      "https://images.unsplash.com/photo-1579722822280-a3d601518cc9",
      "https://images.unsplash.com/photo-1595348020949-87cdfbb44174",
      "https://images.unsplash.com/photo-1579722820308-d74e571900a9",
      "https://images.unsplash.com/photo-1581269631444-9c6cc00df0b6",
      "https://images.unsplash.com/photo-1579722822163-0504256cf3a7",
      "https://images.unsplash.com/photo-1581269631092-f5cbb136ea2e",
      "https://images.unsplash.com/photo-1604480133054-2597dad6f610",
    ],
  },
  {
    test: /pre.?workout/i,
    urls: [
      "https://images.unsplash.com/photo-1693996047008-1b6210099be1",
      "https://images.unsplash.com/photo-1693996045838-980674653385",
      "https://images.unsplash.com/photo-1643043820854-2daf8813fce8",
      "https://images.unsplash.com/photo-1674834726923-3ba828d37846",
      "https://images.unsplash.com/photo-1674834727149-00812f907676",
      "https://images.unsplash.com/photo-1674834727206-4bc272bfd8da",
      "https://images.unsplash.com/photo-1701859077969-fa93c2773d11",
      "https://images.unsplash.com/photo-1704650311981-419f841421cc",
    ],
  },
  {
    test: /bcaa|amino/i,
    urls: [
      "https://images.unsplash.com/photo-1709976142888-6dc0ed1ed78c",
      "https://images.unsplash.com/photo-1709976142402-0ce49c22dbfc",
      "https://images.unsplash.com/photo-1732900293895-233f769299b3",
      "https://images.unsplash.com/photo-1664956617303-83e06c068f7f",
      "https://images.unsplash.com/photo-1664786908163-85ca46f85138",
      "https://images.unsplash.com/photo-1664956617273-c53cd7e5bb50",
    ],
  },
  {
    test: /vitamin|multivitamin/i,
    urls: [
      "https://images.unsplash.com/photo-1596177582967-a5d143a41237",
      "https://images.unsplash.com/photo-1664216294580-079bc527ae49",
      "https://images.unsplash.com/photo-1596177583101-26b7dada4f5c",
      "https://images.unsplash.com/photo-1734607404574-df50e1839d6d",
      "https://images.unsplash.com/photo-1664216294384-28118448d7b0",
      "https://images.unsplash.com/photo-1594362323815-70c3944df76a",
    ],
  },
];

const DEFAULT_URLS = [
  "https://images.unsplash.com/photo-1693996046865-19217d179161",
  "https://images.unsplash.com/photo-1693996045300-521e9d08cabc",
  "https://images.unsplash.com/photo-1593095948071-474c5cc2989d",
  "https://images.unsplash.com/photo-1693996045899-7cf0ac0229c7",
  "https://images.unsplash.com/photo-1704650311190-7eeb9c4f6e11",
  "https://images.unsplash.com/photo-1693996045346-d0a9b9470909",
  "https://images.unsplash.com/photo-1774793476275-6405438753d6",
  "https://images.unsplash.com/photo-1775199603089-e953f3716737",
  "https://images.unsplash.com/photo-1774793476310-fd7d843184c5",
  "https://images.unsplash.com/photo-1595257842044-8f021a58c8a0",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Picks a real, category-relevant stock photo based on the product name —
 * deterministic per name so the same product always gets the same photo,
 * while different products spread across a pool of ~10+ real images.
 */
export function fallbackProductImage(name: string): string {
  const match = FALLBACKS.find((f) => f.test.test(name));
  const pool = match?.urls ?? DEFAULT_URLS;
  const url = pool[hash(name) % pool.length];
  return `${url}?w=900&q=75&auto=format&fit=crop`;
}
