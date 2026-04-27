#!/usr/bin/env python3
import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))
import database
from init_templates_data import TEMPLATES

def init_templates():
    print("Initializing template database...")
    database.init_template_db()

    existing = database.get_templates(page=1, limit=1)
    if existing['total'] > 0:
        print(f"Database already has {existing['total']} templates. Skipping initialization.")
        return False

    print(f"Importing {len(TEMPLATES)} templates...")

    for template in TEMPLATES:
        database.create_template(
            category=template['category'],
            sub_category=template.get('sub_category'),
            name=template['name'],
            description=template.get('description', ''),
            prompt_template=template['prompt_template'],
            example_image=template.get('example_image'),
            original_image=template.get('original_image'),
            tags=json.dumps(template.get('tags', [])) if template.get('tags') else None,
            is_featured=template.get('is_featured', False)
        )

    print(f"Successfully imported {len(TEMPLATES)} templates.")

    categories = database.get_categories()
    print("\nCategories:")
    for cat in categories:
        print(f"  - {cat['category']}: {cat['count']} templates")

    return True

if __name__ == '__main__':
    init_templates()
