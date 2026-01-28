import { createDirectus, rest, staticToken } from '@directus/sdk';
import 'dotenv/config';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://admin.cnsubscribe.xyz';
const ADMIN_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;
if (!ADMIN_TOKEN) {
  console.error('Missing Directus token: set DIRECTUS_STATIC_TOKEN or NEXT_PUBLIC_DIRECTUS_TOKEN');
  process.exit(1);
}

// Configurable field name for product image (either file relation id or a plain URL field)
const PRODUCT_IMAGE_FIELD = process.env.PRODUCT_IMAGE_FIELD || 'product_image';
// Whether the product image field should store a Directus file ID (true) or a URL string (false)
const PRODUCT_IMAGE_IS_FILE = (process.env.PRODUCT_IMAGE_IS_FILE || 'true') === 'true';
// Configurable delay between requests (ms)
const SIM_DELAY_MS = Number(process.env.SIM_DELAY_MS) || 60000;
// If set to 'true', run only a single iteration (useful for testing)
const SINGLE_RUN = (process.env.SINGLE_RUN || 'false') === 'true';

async function uploadImageToDirectus(imageUrl: string) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
    const buffer = await res.arrayBuffer();

    const fileName = imageUrl.split('/').pop()?.split('?')[0] || `upload-${Date.now()}.jpg`;
    const form = new FormData();
    // @ts-ignore - Node FormData accepts Blob/BufferSource
    form.append('file', new Blob([buffer]), fileName);

    const uploadRes = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: form as any,
    });
    const json = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(`Directus upload failed: ${JSON.stringify(json)}`);
    return json.data?.id;
  } catch (err) {
    console.error('Image upload error:', err);
    throw err;
  }
}

const client = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(ADMIN_TOKEN));

const PRODUCT_CATALOG = [
  {
    category: 'Yoga',
    items: [
      { name: 'Non-Slip Yoga Mat', price: 12.50, img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300&q=80' },
      { name: 'Eco Cork Yoga Block', price: 5.80, img: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a9?w=300&q=80' },
      { name: 'Meditation Cushion', price: 18.20, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&q=80' }
    ]
  },
  {
    category: 'Electronics',
    items: [
      { name: 'RGB Mechanical Keyboard', price: 45.00, img: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=300&q=80' },
      { name: 'Noise Cancelling Earbuds', price: 22.50, img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80' },
      { name: 'USB-C Fast Cable (2m)', price: 1.80, img: 'https://images.unsplash.com/photo-1548092372-0d1bd40894a3?w=300&q=80' },
      { name: 'Smart Watch Strap', price: 8.50, img: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=300&q=80' }
    ]
  },
  {
    category: 'Home',
    items: [
      { name: 'Smart LED Desk Lamp', price: 14.20, img: 'https://images.unsplash.com/photo-1507473888900-52e1ad14db3d?w=300&q=80' },
      { name: 'Stainless Steel Bottle', price: 6.50, img: 'https://images.unsplash.com/photo-1602143407151-11115cd4e69b?w=300&q=80' },
      { name: 'Ceramic Coffee Mug', price: 8.90, img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300&q=80' }
    ]
  },
  {
    category: 'Fashion',
    items: [
      { name: 'Oversized Cotton Hoodie', price: 16.00, img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80' },
      { name: 'Canvas Tote Bag', price: 3.20, img: 'https://images.unsplash.com/photo-1597484662317-c93129603519?w=300&q=80' },
      { name: 'Denim Jacket', price: 25.00, img: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&q=80' }
    ]
  }
];

const PLATFORMS = ['TikTok', 'Temu', 'Shein', 'Amazon'];
const REGIONS = ['North America', 'Western Europe', 'Southeast Asia', 'Middle East'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function simulateTraffic() {
  console.log('🚀 Simulation started... Injecting rich data into Directus.');
  console.log('Target:', DIRECTUS_URL);

  while (true) {
    try {
      const category = getRandomItem(PRODUCT_CATALOG);
      const product = getRandomItem(category.items);
      const platform = getRandomItem(PLATFORMS);

      const payload: Record<string, any> = {
        platform: platform,
        product_name: product.name,
        target_price: Number((product.price * (0.9 + Math.random() * 0.2)).toFixed(2)),
        quantity: (platform === 'Temu' || platform === 'Shein') 
          ? Math.floor(Math.random() * 5000) + 1000 
          : Math.floor(Math.random() * 500) + 50,
        status: 'inbound',
        buyer_region: getRandomItem(REGIONS),
        date_created: new Date().toISOString()
      };

      // attach image into configurable field
      if (PRODUCT_IMAGE_IS_FILE) {
        // upload the image to Directus and set the file id
        try {
          const fileId = await uploadImageToDirectus(product.img);
          payload[PRODUCT_IMAGE_FIELD] = fileId;
        } catch (err) {
          console.warn('Failed to upload image, falling back to image URL in payload');
          payload[PRODUCT_IMAGE_FIELD] = product.img;
        }
      } else {
        payload[PRODUCT_IMAGE_FIELD] = product.img;
      }

      const created = await client.items('demands').createOne(payload as any);
      if (!created) throw new Error('Did not receive created item from Directus');
      console.log(
        `[${new Date().toLocaleTimeString()}] ` +
        `✅ Ingested: \x1b[36m${product.name}\x1b[0m ` +
        `from \x1b[33m${platform}\x1b[0m`
      );

      await new Promise(resolve => setTimeout(resolve, SIM_DELAY_MS));

      if (SINGLE_RUN) {
        console.log('SINGLE_RUN enabled — exiting after one iteration');
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ Simulation Error:', error);
      console.log('Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

simulateTraffic();
