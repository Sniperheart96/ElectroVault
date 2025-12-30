#!/usr/bin/env python3
"""
Intelligente Level-Korrektur basierend auf children-Tiefe
"""

import re

file_path = r'C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault\packages\database\prisma\seeds\06-historical-components.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verarbeitung: Zähle "children: [" um die Tiefe zu bestimmen
depth = 0
output_lines = []

for line in lines:
    # Zähle children-Tiefe
    if 'children: [' in line:
        depth += 1

    # Ersetze level: X, durch korrekten Wert basierend auf Tiefe
    if re.search(r'level:\s*\d+,', line):
        # Domain = level 1, Family = level 2, Type = level 3, Subtype = level 4
        # depth 0 = keine children davor = Domain (level 1)
        # depth 1 = 1x children davor = Family (level 2)
        # depth 2 = 2x children davor = Type (level 3)
        # depth 3 = 3x children davor = Subtype (level 4)
        correct_level = depth + 1
        line = re.sub(r'level:\s*\d+,', f'level: {correct_level},', line)

    # Reduziere depth wenn children-Block endet
    if '],' in line and 'children' not in line:
        # Prüfe ob vorherige Zeile ein children-Block-Ende ist
        if output_lines and 'children' in ''.join(output_lines[-5:]):
            depth = max(0, depth - 1)

    output_lines.append(line)

# AttributeDataType.SELECT durch STRING ersetzen
output = ''.join(output_lines)
output = output.replace('AttributeDataType.SELECT', 'AttributeDataType.STRING')

with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(output)

print("File fixed successfully")
print("- Level values corrected based on structure")
print("- AttributeDataType.SELECT -> AttributeDataType.STRING")
