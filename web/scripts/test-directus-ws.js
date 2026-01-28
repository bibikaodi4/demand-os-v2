(async () => {
  try {
    const { createDirectus, realtime } = require('@directus/sdk');
    require('dotenv').config();

    const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'http://admin.cnsubscribe.xyz';
    const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;

    if (!TOKEN) {
      console.error('Missing token: set DIRECTUS_STATIC_TOKEN or NEXT_PUBLIC_DIRECTUS_TOKEN in env');
      process.exit(1);
    }

    const client = createDirectus(DIRECTUS_URL).with(realtime({ authMode: 'public', debug: true }));
    console.log('Connecting to', DIRECTUS_URL);
    await client.connect();
    console.log('Connected. Subscribing to demands create events...');

    const { subscription, unsubscribe } = await client.subscribe('demands', { event: 'create', query: { fields: ['*'] } });

    (async () => {
      for await (const msg of subscription) {
        console.log('Received message:', JSON.stringify(msg, null, 2));
      }
    })();

    // wait for 15s then cleanup
    setTimeout(async () => {
      try { await unsubscribe(); } catch {}
      try { await client.disconnect(); } catch {}
      console.log('Test finished — cleaned up.');
      process.exit(0);
    }, 15000);

  } catch (e) {
    console.error('Test failed:', e);
    process.exit(2);
  }
})();
