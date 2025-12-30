#!/usr/bin/env python3
import re

file_path = r'C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault\packages\database\prisma\seeds\06-historical-components.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Strategie: Zähle führende Leerzeichen vor "slug:" und "level:"
# Mehr Einrückung = höheres Level

def fix_levels(content):
    lines = content.split('\n')
    result = []
    indent_to_level = {}

    for line in lines:
        # Finde slug-Zeilen und merke uns die Einrückung
        slug_match = re.match(r'^(\s+)slug:\s*[\'"]', line)
        if slug_match:
            indent = len(slug_match.group(1))
            # Berechne Level basierend auf Einrückung
            # 6 Leerzeichen = level 1 (Domain)
            # 10 Leerzeichen = level 2 (Family)
            # 14 Leerzeichen = level 3 (Type)
            # 18 Leerzeichen = level 4 (Subtype)
            if indent <= 8:
                level = 1
            elif indent <= 12:
                level = 2
            elif indent <= 16:
                level = 3
            else:
                level = 4

            indent_to_level[indent] = level

        # Ersetze level-Werte
        level_match = re.match(r'^(\s+)level:\s*\d+,', line)
        if level_match:
            indent = len(level_match.group(1))
            # Finde nächst kleinere Einrückung
            level = indent_to_level.get(indent, 4)  # Default 4
            line = re.sub(r'(^\s+level:\s*)\d+(,)', r'\g<1>' + str(level) + r'\g<2>', line)

        result.append(line)

    return '\n'.join(result)

# Fix levels
content = fix_levels(content)

# Fix AttributeDataType
content = content.replace('AttributeDataType.SELECT', 'AttributeDataType.STRING')

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("File fixed")
