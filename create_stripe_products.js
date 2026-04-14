/**
 * create_stripe_products.js
 * 
 * Creates all products from unified_products_en_gbp.json on Stripe
 * and saves their price IDs to data/stripe_product_mapping.json
 * 
 * Usage: node create_stripe_products.js
 */
require('dotenv').config({ path: '.env' });
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error('STRIPE_SECRET_KEY not found in .env');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY);
const DATA_FILE = path.join(__dirname, 'data', 'unified_products_en_gbp.json');
const MAPPING_FILE = path.join(__dirname, 'data', 'stripe_product_mapping.json');

async function main() {
  const { products } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  // Load existing mapping so we don't re-create already registered products
  let existingMapping = {};
  try {
    existingMapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  } catch(e) {}

  console.log(`Found ${products.length} products. Starting Stripe registration...`);

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    if (existingMapping[product.handle]) {
      skipped++;
      continue; // Already registered
    }

    try {
      // Create product on Stripe
      const stripeProduct = await stripe.products.create({
        name: product.title,
        description: product.description,
        metadata: {
          handle: product.handle,
          sku: product.sku,
          category: product.category
        },
        images: product.images.slice(0, 1).map(img => {
          // Only include full URLs, not relative paths
          if (img.startsWith('http')) return img;
          return null;
        }).filter(Boolean)
      });

      // Create price for the product
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(product.price.regular * 100), // Convert to pence
        currency: 'gbp',
        metadata: {
          handle: product.handle
        }
      });

      existingMapping[product.handle] = {
        product_id: stripeProduct.id,
        price_id: stripePrice.id
      };

      created++;
      console.log(`✓ [${created}] ${product.title} → ${stripePrice.id}`);

      // Save after each product in case of interruption
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(existingMapping, null, 2), 'utf8');

    } catch (err) {
      console.error(`✗ Failed for ${product.title}:`, err.message);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped (already existed): ${skipped}`);
  console.log(`Mapping saved to ${MAPPING_FILE}`);
}

main().catch(console.error);
