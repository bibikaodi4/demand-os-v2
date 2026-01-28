try { require('dotenv').config(); } catch (e) {}
const fetch = global.fetch;

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://admin.cnsubscribe.xyz';
const ADMIN_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;
if (!ADMIN_TOKEN) {
  console.error('Missing Directus token: set DIRECTUS_STATIC_TOKEN or NEXT_PUBLIC_DIRECTUS_TOKEN');
  process.exit(1);
}

const COUNT = Number(process.env.COUNT) || 50;
const DELAY_MS = Number(process.env.DELAY_MS) || 300;
const PRODUCT_IMAGE_FIELD = process.env.PRODUCT_IMAGE_FIELD || 'product_image';
const PRODUCT_IMAGE_IS_FILE = (process.env.PRODUCT_IMAGE_IS_FILE || 'true') === 'true';

const CATEGORIES = [
  { category: 'Yoga', items: [
    { name: 'Non-Slip Yoga Mat', price: 12.5, img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80' },
    { name: 'Eco Cork Yoga Block', price: 5.8, img: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a9?w=800&q=80' },
    { name: 'Meditation Cushion', price: 18.2, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80' }
  ]},
  { category: 'Electronics', items: [
    { name: 'RGB Mechanical Keyboard', price: 45.0, img: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=800&q=80' },
    { name: 'Noise Cancelling Earbuds', price: 22.5, img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80' },
    { name: 'USB-C Fast Cable (2m)', price: 1.8, img: 'https://images.unsplash.com/photo-1548092372-0d1bd40894a3?w=800&q=80' },
    { name: 'Smart Watch Strap', price: 8.5, img: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80' }
  ]},
  { category: 'Home', items: [
    { name: 'Smart LED Desk Lamp', price: 14.2, img: 'https://images.unsplash.com/photo-1507473888900-52e1ad14db3d?w=800&q=80' },
    { name: 'Stainless Steel Bottle', price: 6.5, img: 'https://images.unsplash.com/photo-1602143407151-11115cd4e69b?w=800&q=80' },
    { name: 'Ceramic Coffee Mug', price: 8.9, img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80' }
  ]},
  { category: 'Fashion', items: [
    { name: 'Oversized Cotton Hoodie', price: 16.0, img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80' },
    { name: 'Canvas Tote Bag', price: 3.2, img: 'https://images.unsplash.com/photo-1597484662317-c93129603519?w=800&q=80' },
    { name: 'Denim Jacket', price: 25.0, img: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80' }
  ]},
  { category: 'Outdoors', items: [
    { name: 'Camping Hammock', price: 21.0, img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80' },
    { name: 'Insulated Water Bottle', price: 12.0, img: 'https://images.unsplash.com/photo-1526403224741-8c6f6b3d3b1f?w=800&q=80' }
  ]}
];

const PLATFORMS = ['TikTok', 'Temu', 'Shein', 'Amazon', 'Etsy', 'Shopify'];
const REGIONS = ['North America', 'Western Europe', 'Southeast Asia', 'Middle East', 'Latin America', 'Australia'];
const STATUSES = ['inbound', 'processing', 'shipped', 'closed'];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function uploadImageToDirectus(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Download failed ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const fileName = (imageUrl.split('/').pop() || `file-${Date.now()}`).split('?')[0];

    const form = new FormData();
    const blob = new Blob([arrayBuffer], { type: contentType });
    form.append('file', blob, fileName);

    const uploadRes = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: form,
    });
    const json = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(JSON.stringify(json));
    return json.data && json.data.id;
  } catch (e) {
    console.warn('uploadImageToDirectus error:', e.message || e);
    throw e;
  }
}

async function createDemand(item) {
  const res = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/items/demands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify(item),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.data;
}

(async function batchRun() {
  console.log(`Batch start: creating ${COUNT} demands against ${DIRECTUS_URL}`);
  for (let i = 0; i < COUNT; i++) {
    try {
      const cat = getRandom(CATEGORIES);
      const prod = getRandom(cat.items);
      const platform = getRandom(PLATFORMS);
      const status = getRandom(STATUSES);

      const price = Number((prod.price * (0.7 + Math.random() * 0.8)).toFixed(2));
      const quantity = (platform === 'Temu' || platform === 'Shein') ? randInt(500, 5000) : randInt(10, 800);

      const payload = {
        platform,
        product_name: prod.name,
        category: cat.category,
        target_price: price,
        quantity,
        status,
        buyer_region: getRandom(REGIONS),
        created_at: new Date().toISOString(),
      };

      if (PRODUCT_IMAGE_IS_FILE) {
        try {
          const fileId = await uploadImageToDirectus(prod.img);
          payload[PRODUCT_IMAGE_FIELD] = fileId;
        } catch (e) {
          payload[PRODUCT_IMAGE_FIELD] = prod.img; // fallback to URL
        }
      } else {
        payload[PRODUCT_IMAGE_FIELD] = prod.img;
      }

      const created = await createDemand(payload);
      console.log(`[${i+1}/${COUNT}] Created id: ${created && created.id ? created.id : JSON.stringify(created)}`);
    } catch (e) {
      console.error(`[${i+1}/${COUNT}] Error creating demand:`, e.message || e);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  console.log('Batch complete');
})();
