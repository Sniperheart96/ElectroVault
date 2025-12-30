#!/usr/bin/env python3
"""
Fix level values in 06-historical-components.ts
Changes level: 0 → 1, level: 1 → 2, level: 2 → 3, level: 3 → 4
Also replaces AttributeDataType.SELECT with AttributeDataType.STRING
"""

import re

file_path = r'C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault\packages\database\prisma\seeds\06-historical-components.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Schritt 1: Level-Werte durch temporäre Marker ersetzen (höchste zuerst)
content = content.replace('level: 3,', 'level: TEMP3,')
content = content.replace('level: 2,', 'level: TEMP2,')
content = content.replace('level: 1,', 'level: TEMP1,')
content = content.replace('level: 0,', 'level: TEMP0,')

# Schritt 2: Temporäre Marker durch neue Werte ersetzen
content = content.replace('level: TEMP0,', 'level: 1,')
content = content.replace('level: TEMP1,', 'level: 2,')
content = content.replace('level: TEMP2,', 'level: 3,')
content = content.replace('level: TEMP3,', 'level: 4,')

# Schritt 3: Level 4 durch 5 ersetzen (falls vorhanden, aber sollte nicht sein im Original)
#content = content.replace('level: 4,', 'level: 5,')

# Schritt 4: AttributeDataType.SELECT durch STRING ersetzen
content = content.replace('AttributeDataType.SELECT', 'AttributeDataType.STRING')

with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("✅ File fixed successfully")
print("- Level values: 0→1, 1→2, 2→3, 3→4")
print("- AttributeDataType.SELECT → AttributeDataType.STRING")
