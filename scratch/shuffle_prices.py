import json
import random

# Mapping of regular prices to their original price ranges
PRICE_CONFIGS = [
    {"regular": 26.99, "original_range": (119, 127)},
    {"regular": 28.99, "original_range": (129, 135)},
    {"regular": 29.99, "original_range": (139, 145)},
    {"regular": 30.99, "original_range": (133, 156)},
    {"regular": 31.99, "original_range": (135, 148)}
]

FILE_PATH = "d:/lucas/Desktop/perfumUkStripe/data/unified_products_en_gbp.json"

def shuffle_prices():
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        last_price = None
        for i, product in enumerate(data.get("products", [])):
            
            if i < 4:
                # Force specific unique prices for the first row to guarantee perfect variety
                forced_sequence = [26.99, 31.99, 28.99, 30.99]
                config = next(c for c in PRICE_CONFIGS if c["regular"] == forced_sequence[i])
            else:
                # Choose a random config that is different from the last used price
                available_configs = [c for c in PRICE_CONFIGS if c["regular"] != last_price]
                config = random.choice(available_configs)
            
            regular_price = config["regular"]
            last_price = regular_price
            
            original_price = random.randint(config["original_range"][0], config["original_range"][1])
            
            # Update price object
            if "price" not in product:
                product["price"] = {}
                
            product["price"]["regular"] = regular_price
            product["price"]["original_price"] = original_price
            
            # Calculate discount percent
            discount = round((1 - (regular_price / original_price)) * 100)
            product["price"]["discount_percent"] = discount
            
            # Set currency and other defaults if missing
            product["price"]["currency"] = "GBP"
            product["price"]["on_sale"] = True

        with open(FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully shuffled prices for {len(data.get('products', []))} products.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    shuffle_prices()
