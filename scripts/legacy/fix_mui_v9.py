import re
import os

# Files to fix (based on error output)
files_to_fix = [
    'src/pages/faculty/FacultyQuestionBank.tsx',
    'src/pages/FacultyQuestionBank.tsx',
    'src/pages/PaperGeneratorAdmin.tsx',
    'src/pages/QuestionBank.tsx',
]

def fix_grid_v9(content):
    """
    Convert MUI v5 Grid syntax to MUI v9 Grid syntax.
    
    v5: <Grid item xs={12} sm={6} md={3}>
    v9: <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    """
    
    def replace_grid(match):
        tag_content = match.group(1)
        
        # Extract breakpoint props: xs={12}, sm={6}, etc.
        bp_pattern = r'(xs|sm|md|lg|xl)=\{([^}]+)\}'
        bp_matches = list(re.finditer(bp_pattern, tag_content))
        
        if not bp_matches:
            return match.group(0)
        
        # Build size={{ xs: 12, sm: 6, md: 3 }}
        size_entries = []
        for bp_match in bp_matches:
            bp_name = bp_match.group(1)
            bp_value = bp_match.group(2)
            size_entries.append(f'{bp_name}: {bp_value}')
        
        size_prop = 'size={{ ' + ', '.join(size_entries) + ' }}'
        
        # Remove breakpoint props and 'item' from tag content
        cleaned = tag_content
        for bp_match in bp_matches:
            cleaned = cleaned.replace(bp_match.group(0), '')
        cleaned = re.sub(r'\bitem\b', '', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Rebuild the tag
        if cleaned:
            return f'<Grid {cleaned} {size_prop}>'
        else:
            return f'<Grid {size_prop}>'
    
    # Match <Grid ...> tags that contain 'item'
    pattern = r'<Grid\s+([^>]*item[^>]*)>'
    content = re.sub(pattern, replace_grid, content)
    
    return content

def fix_implicit_any(content):
    """Fix implicit 'any' type errors."""
    
    # Fix setFilters(prev => ...)
    content = re.sub(
        r'setFilters\(prev =>',
        'setFilters((prev: any) =>',
        content
    )
    
    # Fix .slice(...).map(tag => ...)
    content = re.sub(
        r'\.slice\([^)]+\)\.map\(tag =>',
        '.slice(0, 3).map((tag: string) =>',
        content
    )
    
    # Fix options.map((opt, i) => ...)
    content = re.sub(
        r'\.options\.map\(\(opt, i\) =>',
        '.options.map((opt: { id?: string; text: string; isCorrect?: boolean }, i: number) =>',
        content
    )
    
    # Fix ? (data) => handleUpdate
    content = re.sub(
        r'\? \(data\) =>',
        '? (data: any) =>',
        content
    )
    
    return content

def fix_batches_prop(content):
    """Remove batches prop from form components if not supported."""
    content = re.sub(
        r'\s+batches=\{batches\}\n',
        '\n',
        content
    )
    return content

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        print(f"SKIP (not found): {filepath}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = fix_grid_v9(content)
    content = fix_implicit_any(content)
    content = fix_batches_prop(content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"FIXED: {filepath}")
    else:
        print(f"NO CHANGES: {filepath}")

print("\nDone! Run 'npx tsc --noEmit' to check remaining errors.")