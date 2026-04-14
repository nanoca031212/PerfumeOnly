import json
import re
import os

def parse_briefing(content):
    perfumes = []
    
    # Masculinos section starts around line 80
    # Femininos section starts around line 831
    
    masculinos_match = re.search(r'♂\s+MASCULINOS(.*?)\s+♀\s+FEMININOS', content, re.DOTALL)
    femininos_match = re.search(r'♀\s+FEMININOS(.*?)\s+7\.\s+Percepcao do Cliente', content, re.DOTALL)
    
    def extract_perfumes(section_text):
        results = []
        # Pattern to match: number, then title, then brand, then category
        # 1\n1 Million\nPaco Rabanne\nPopular
        # Using a more flexible approach: split by lines and look for patterns
        lines = [l.strip() for l in section_text.split('\n') if l.strip()]
        
        i = 0
        while i < len(lines):
            line = lines[i]
            if line.isdigit():
                # Potential start of a perfume entry
                try:
                    title = lines[i+1]
                    brand = lines[i+2]
                    category = lines[i+3]
                    
                    # Valid categories
                    valid_categories = ['Entrada', 'Popular', 'Mid-Premium', 'Upper', 'Niche/Luxo']
                    if category in valid_categories:
                        results.append({
                            'title': title,
                            'brand': brand,
                            'category': category
                        })
                        i += 4
                        continue
                except IndexError:
                    pass
            i += 1
        return results

    if masculinos_match:
        perfumes.extend(extract_perfumes(masculinos_match.group(1)))
    
    if femininos_match:
        perfumes.extend(extract_perfumes(femininos_match.group(1)))
        
    return perfumes

def get_price(category):
    mapping = {
        'Entrada': 25.00,
        'Popular': 26.00,
        'Mid-Premium': 27.00,
        'Upper': 28.00,
        'Niche/Luxo': 29.00
    }
    return mapping.get(category, 26.00)

def normalize(text):
    text = text.lower()
    text = text.replace('1', 'one')
    text = text.replace('&', 'and')
    text = text.replace('d&g', 'dolce and gabbana')
    text = text.replace('ysl', 'yves saint laurent')
    text = re.sub(r'[^a-z0-9]', '', text)
    return text

def main():
    briefing_path = r"D:\lucas\Desktop\perfumUkStripe\scratch\briefing_content.txt"
    json_path = r"D:\lucas\Desktop\perfumUkStripe\data\unified_products_en_gbp.json"
    
    with open(briefing_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    briefing_perfumes = parse_briefing(content)
    print(f"Parsed {len(briefing_perfumes)} perfumes from briefing.")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    products = data['products']
    updated_count = 0
    
    # Pre-calculate normalized titles
    for p in products:
        p['_norm'] = normalize(p['title'])
        # Also include brand in norm for better matching
        p['_norm_full'] = normalize(p['title'] + ' ' + (p['primary_brand'] or ''))

    for bp in briefing_perfumes:
        match = None
        bp_title_norm = normalize(bp['title'])
        bp_full_norm = normalize(bp['title'] + ' ' + bp['brand'])
        
        # Try finding match
        for p in products:
            # Check if briefing title (norm) is in JSON title (norm) or vice-versa
            if bp_title_norm in p['_norm'] or p['_norm'] in bp_title_norm:
                match = p
                break
            if bp_full_norm in p['_norm_full'] or p['_norm_full'] in bp_full_norm:
                match = p
                break
        
        # Special cases/overrides
        if not match:
            overrides = {
                '1 million': 'one million',
                '1 million parfum': 'million',
                '212 black': '212 men',
                'bulgari in black': 'bvlgari man in black',
                'chloe signature': 'chloe',
                'laboratorio olfattivo': 'laboratorio olfattivo',
                'miss 212': '212 vip carolina herrera',
                'terre d\'hermes': 'hermes',
                'good girl': 'carolina herrera good',
                'l\'interdit': 'interdit',
                'alien': 'alien',
                'angel': 'angel',
                'phantom': 'phantom',
                'scandal': 'scandal',
                'olympea': 'olympea',
                'black opium': 'black opium',
            }
            norm_title = bp['title'].lower()
            for key, val in overrides.items():
                if key in norm_title:
                    target = normalize(val)
                    for p in products:
                        if target in p['_norm']:
                            match = p
                            break
                    if match: break

        if match:
            match['title'] = f"{bp['title']} {bp['brand']}"
            match['price']['regular'] = get_price(bp['category'])
            match['price']['on_sale'] = False
            match['price']['sale'] = None
            match['price']['discount_percent'] = 0
            match['_updated'] = True
            updated_count += 1

    # Final pass for those that were not updated
    for p in products:
        if '_norm' in p: del p['_norm']
        if '_norm_full' in p: del p['_norm_full']
        if '_updated' not in p:
            p['price']['regular'] = 26.00
            p['price']['on_sale'] = False
            p['price']['sale'] = None
            p['price']['discount_percent'] = 0
        else:
            del p['_updated']

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated_count} products.")
    print("Saved updated JSON.")

if __name__ == "__main__":
    main()
