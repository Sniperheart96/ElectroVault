#!/usr/bin/env python3
"""
Fix level values based on comment markers
DOMAIN = level 1
FAMILY = level 2
TYPE = level 3
Subtype (keine Kommentare) = level 4
"""

import re

file_path = r'C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault\packages\database\prisma\seeds\06-historical-components.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
expected_level = None

for i, line in enumerate(lines):
    #  Erkenne Kommentare und setze expected_level
    if '// DOMAIN' in line:
        expected_level = 1
    elif '// FAMILY' in line:
        expected_level = 2
    elif '// TYPE' in line:
        expected_level = 3
    # Wenn kein Kommentar und vorherige Zeile war ein Kommentar mit TYPE, dann Subtype
    elif expected_level == 3 and i > 0 and '// TYPE' in lines[i-1]:
        pass  # Behalte expected_level = 3 für das nächste slug
    # Wenn slug ohne vorherigen Kommentar, ist es ein Subtype (level 4)
    elif re.search(r"slug:\s*'", line):
        # Prüfe ob in den letzten 5 Zeilen ein Kommentar war
        recent_lines = ''.join(lines[max(0, i-5):i])
        if '// DOMAIN' not in recent_lines and '// FAMILY' not in recent_lines and '// TYPE' not in recent_lines:
            if expected_level is not None and expected_level < 4:
                expected_level = 4

    # Ersetze level: X, wenn expected_level gesetzt ist
    if expected_level is not None and re.search(r'level:\s*\d+,', line):
        line = re.sub(r'level:\s*\d+,', f'level: {expected_level},', line)
        # expected_level bleibt für die Kinderelemente erhalten

    # Reset expected_level bei Ende eines Blocks
    if '],\n' in line or '},' in line:
        expected_level = None

    output_lines.append(line)

# AttributeDataType.SELECT durch STRING ersetzen
output = ''.join(output_lines)
output = output.replace('AttributeDataType.SELECT', 'AttributeDataType.STRING')

with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(output)

print("File fixed successfully")
