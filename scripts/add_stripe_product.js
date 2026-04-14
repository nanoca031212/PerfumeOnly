require('dotenv').config();
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const HANDLE = 'paco-rabanne-one-million';
const TITLE = '1 Million Paco Rabanne';
const PRICE_PENCE = 2700; // £27.00 in pence

const mappingPath = path.join(__dirname, '../data/stripe_product_mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

if (mapping[HANDLE]) {
  console.log(`Product "${HANDLE}" already exists in Stripe mapping. Skipping.`);
  process.exit(0);
}

async function run() {
  try {
    // Create Stripe product
    const product = await stripe.products.create({
      name: TITLE,
      description: 'Premium authentic fragrance 100ml EDP - fast delivery in the UK.',
    });
    console.log(`Created Stripe product: ${product.id}`);

    // Create Stripe price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRICE_PENCE,
      currency: 'gbp',
    });
    console.log(`Created Stripe price: ${price.id}`);

    // Update mapping file
    mapping[HANDLE] = {
      product_id: product.id,
      price_id: price.id,
    };

    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`Updated stripe_product_mapping.json with "${HANDLE}"`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
