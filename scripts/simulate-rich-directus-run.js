try { require('dotenv').config(); } catch (e) {}
// don't require @directus/sdk in this runner; use REST calls via fetch

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://admin.cnsubscribe.xyz';
const ADMIN_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;
if (!ADMIN_TOKEN) {
  console.error('Missing Directus token: set DIRECTUS_STATIC_TOKEN or NEXT_PUBLIC_DIRECTUS_TOKEN');
  process.exit(1);
}

const PRODUCT_IMAGE_FIELD = process.env.PRODUCT_IMAGE_FIELD || 'product_image';
const PRODUCT_IMAGE_IS_FILE = (process.env.PRODUCT_IMAGE_IS_FILE || 'true') === 'true';
const SINGLE_RUN = (process.env.SINGLE_RUN || 'false') === 'true';

async function createDemand(item) {
  const res = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/items/demands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify(item),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Create demand failed: ${JSON.stringify(json)}`);
  return json.data;
}

const PRODUCT = { name: 'Test Upload Item', price: 9.99, img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80' };

async function uploadImageToDirectus(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const fileName = imageUrl.split('/').pop().split('?')[0] || `upload-${Date.now()}.jpg`;

  const form = new FormData();
  const blob = new Blob([arrayBuffer], { type: contentType });
  form.append('file', blob, fileName);

  const uploadRes = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: form,
  });
  const json = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(`Directus upload failed: ${JSON.stringify(json)}`);
  return json.data && json.data.id;
}

(async function run() {
  try {
    console.log('Starting single-run test against', DIRECTUS_URL);
    const payload = {
      platform: 'TestPlatform',
      product_name: PRODUCT.name,
      target_price: PRODUCT.price,
      quantity: 10,
      status: 'inbound',
      buyer_region: 'TestRegion',
      date_created: new Date().toISOString(),
    };

    if (PRODUCT_IMAGE_IS_FILE) {
      try {
        const fileId = await uploadImageToDirectus(PRODUCT.img);
        payload[PRODUCT_IMAGE_FIELD] = fileId;
        console.log('Uploaded image, file id:', fileId);
      } catch (e) {
        console.warn('Upload failed, falling back to URL:', e.message || e);
        payload[PRODUCT_IMAGE_FIELD] = PRODUCT.img;
      }
    } else {
      payload[PRODUCT_IMAGE_FIELD] = PRODUCT.img;
    }

    const created = await createDemand(payload);
    console.log('Created demand id:', created && created.id ? created.id : created);

    if (SINGLE_RUN) process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
