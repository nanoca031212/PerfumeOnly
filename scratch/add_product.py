import json
from datetime import datetime

path = 'data/unified_products_en_gbp.json'
data = json.load(open(path, 'r', encoding='utf-8'))
products = data['products']

next_id = str(max(int(p['id']) for p in products) + 1)
folder_name = 'Paco Rabanne One Million'
image_file = 'D_NQ_NP_2X_638976-MLB92862010987_092025-F.jpg'
handle = 'paco-rabanne-one-million'
now = datetime.utcnow().isoformat() + 'Z'

new_product = {
    'id': next_id,
    'handle': handle,
    'title': '1 Million Paco Rabanne',
    'description': 'Experience the luxurious scent of 1 Million Paco Rabanne. Premium authentic fragrance with fast delivery in the UK.',
    'description_html': '<div class="product-description"><h3>1 Million Paco Rabanne</h3><p>An exceptional fragrance offering unprecedented value and luxury.</p></div>',
    'sku': f'FRAG-{next_id.zfill(4)}',
    'price': {
        'regular': 27.0,
        'sale': None,
        'original_price': 72.0,
        'on_sale': False,
        'discount_percent': 0,
        'currency': 'GBP'
    },
    'category': 'Fragrances',
    'brands': ['Paco Rabanne'],
    'primary_brand': 'Paco Rabanne',
    'tags': ['perfume', 'uk', 'premium', 'fragrance', 'paco rabanne', 'masculine'],
    'images': [
        f'/assets/products/fragrances/Paco%20Rabanne%20One%20Million/{image_file}'
    ],
    'is_combo': False,
    'featured': False,
    'popularity': 0,
    'status': 'active',
    'slug': handle,
    'categories': ['Fragrances'],
    'gender': 'male',
    'created_at': now,
    'updated_at': now
}

products.append(new_product)
json.dump(data, open(path, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print(f'Added product ID {next_id}: {new_product["title"]}')
