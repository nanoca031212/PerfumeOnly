const fs = require('fs');
const path = require('path');

const FRAGRANCES_ROOT = path.join(__dirname, 'fragfrag');
const PUBLIC_ROOT = path.join(__dirname, 'public', 'assets', 'products', 'fragrances');
const DATA_FILE = path.join(__dirname, 'data', 'unified_products_en_gbp.json');
const BRANDS_FILE = path.join(__dirname, 'data', 'brands.json');

console.log('Starting migration from fragfrag...');

// Clear existing destination for a clean state
if (fs.existsSync(PUBLIC_ROOT)) {
    console.log('Clearing existing product assets...');
    fs.rmSync(PUBLIC_ROOT, { recursive: true, force: true });
}

// Ensure destination exists
if (!fs.existsSync(PUBLIC_ROOT)) {
    fs.mkdirSync(PUBLIC_ROOT, { recursive: true });
}

// Read brands for matching
let knownBrands = [];
try {
    if (fs.existsSync(BRANDS_FILE)) {
        const brandsData = JSON.parse(fs.readFileSync(BRANDS_FILE, 'utf8'));
        knownBrands = brandsData.brands || [];
    }
} catch (e) {
    console.error('Error reading brands:', e);
}

// Get all subdirectories in fragfrag
const folders = fs.readdirSync(FRAGRANCES_ROOT)
    .filter(f => fs.statSync(path.join(FRAGRANCES_ROOT, f)).isDirectory());

console.log(`Found ${folders.length} fragrance folders.`);

const products = folders.map((folder, index) => {
    // Use folder name EXACTLY as title — no trimming, no word cutting
    const title = folder;
    
    const folderPath = path.join(FRAGRANCES_ROOT, folder);
    const destFolder = path.join(PUBLIC_ROOT, title); // Use clean title for dest folder

    // Copy folder to public
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
    }
    const files = fs.readdirSync(folderPath);
    const images = [];
    files.forEach(file => {
        if (file.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
            fs.copyFileSync(path.join(folderPath, file), path.join(destFolder, file));
            images.push(`/assets/products/fragrances/${encodeURIComponent(title)}/${file}`);
        }
    });

    // Slugify
    const handle = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Brand matching
    let productBrands = [];
    let primaryBrand = "Premium Fragrance";
    
    // Sort brands by length descending to match longest name first (e.g., "Giorgio Armani" before "Armani")
    const sortedBrands = [...knownBrands].sort((a, b) => b.name.length - a.name.length);
    
    sortedBrands.forEach(b => {
        if (title.toLowerCase().includes(b.name.toLowerCase())) {
            productBrands.push(b.name);
            if (primaryBrand === "Premium Fragrance") primaryBrand = b.name;
        }
    });
    
    if (productBrands.length === 0) {
        // Try to guess brand from the first word
        const firstWord = title.split(' ')[0];
        if (firstWord && firstWord.length > 2 && !['Eau', 'Parfum', 'Fragrance'].includes(firstWord)) {
            productBrands = [firstWord];
            primaryBrand = firstWord;
        } else {
            productBrands = ["Premium Fragrance"];
        }
    }

    // Ensure brands is a unique array
    productBrands = [...new Set(productBrands)];

    const productId = (index + 1).toString();

    return {
        id: productId,
        handle: handle,
        title: title,
        description: `Experience the luxurious scent of ${title}. Premium authentic fragrance with fast delivery in the UK.`,
        description_html: `<div class="product-description"><h3>${title}</h3><p>An exceptional fragrance offering unprecedented value and luxury. Perfect for those who appreciate premium scents.</p></div>`,
        sku: `FRAG-${productId.padStart(4, '0')}`,
        price: {
            regular: 49.99,
            sale: null,
            on_sale: false,
            discount_percent: 0,
            currency: "GBP"
        },
        category: "Fragrances",
        brands: productBrands,
        primary_brand: primaryBrand,
        tags: ["perfume", "uk", "premium", "fragrance", ...primaryBrand.toLowerCase().split(' ')],
        images: images,
        is_combo: false,
        featured: false,
        popularity: 0,
        status: "active",
        slug: handle,
        categories: ["Fragrances"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
});

const output = {
    products: products
};

fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2), 'utf8');

console.log(`Successfully migrated ${products.length} fragrances.`);
console.log(`Product list saved to ${DATA_FILE}`);
