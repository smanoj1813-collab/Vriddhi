#!/usr/bin/env python3
"""Add illustration images to key BBA topic explanationMd fields."""
from pathlib import Path

FILE = Path("functions/src/data/bbaSeedData.ts")
text = FILE.read_text()

# Map topic ID -> image asset path
IMAGE_MAP = {
    # Economics
    'eco-mod2-production-functions': 'supply-demand-curve.png',
    'eco-mod3-cost-curves': 'cost-curves.png',
    'eco-mod4-market-structures': 'market-structures.png',
    'eco-mod5-managerial-pricing': 'supply-demand-curve.png',
    
    # Financial Management
    'fm-mngt-mod1-time-value-of-money': 'break-even-analysis.png',
    'fm-mngt-mod5-capital-budgeting': 'break-even-analysis.png',
    
    # Management Accounting
    'mgmt-mod5-marginal-costing-decision-making': 'break-even-analysis.png',
    
    # Accounting
    'acc-mod2-journal-ledger-trial-balance': 'financial-statements.png',
    'acc-mod5-final-accounts-adjustments': 'financial-statements.png',
    
    # MPA
    'mpa-mod3-organizing': 'org-structure.png',
    
    # Strategy
    'strat-mod3-swot-pestle-analysis': 'swot-analysis.png',
    'strat-mod5-corporate-level-strategies': 'bcg-matrix.png',
    
    # Operations
    'ops-mod3-inventory-management': 'org-structure.png',
}

def add_image_to_topic(text, tid, image_file):
    """Add image markdown to a topic's explanationMd. Returns new text or original."""
    id_pattern = "id: '" + tid + "'"
    id_pos = text.find(id_pattern)
    if id_pos < 0:
        print(f"  WARNING: Topic '{tid}' not found")
        return text, False
    
    expl_marker = "explanationMd: `"
    expl_pos = text.find(expl_marker, id_pos)
    if expl_pos < 0:
        print(f"  WARNING: explanationMd not found for '{tid}'")
        return text, False
    
    bt_start = expl_pos + len(expl_marker)
    bt_end = text.find("`", bt_start)
    if bt_end < 0:
        print(f"  WARNING: Closing backtick not found for '{tid}'")
        return text, False
    
    current_expl = text[bt_start:bt_end]
    
    if image_file in current_expl:
        print(f"  SKIP: '{tid}' already has image {image_file}")
        return text, True
    
    image_md = "\n\n![{0} Diagram]({1})\n\n".format(tid.replace('-', ' ').title(), image_file)
    new_expl = current_expl.rstrip() + image_md
    
    text_new = text[:bt_start] + new_expl + text[bt_end:]
    return text_new, True

count = 0
for tid, image_file in IMAGE_MAP.items():
    print(f"Processing {tid} -> {image_file}...")
    text, changed = add_image_to_topic(text, tid, image_file)
    if changed:
        count += 1

FILE.write_text(text)
print(f"\nDone! Updated {count} topics with images.")
print(f"Images saved to: src/assets/prep-images/")