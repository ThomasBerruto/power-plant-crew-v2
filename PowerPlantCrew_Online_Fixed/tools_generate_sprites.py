"""Generate original little 2D technician PNG sprites from scalable vector shapes.
No original Among Us character or extracted game sprite is included.
Run: python tools_generate_sprites.py (requires cairosvg).
"""
from pathlib import Path
import cairosvg
p=Path(__file__).parent/'public/assets/technicians';p.mkdir(parents=True,exist_ok=True)
styles=[
 ('amber','#e9ac22','#f3d65a','#e9f7fb','#6f4c22'),
 ('cyan','#1eb4b8','#f3c54e','#daf9fc','#146071'),
 ('ruby','#de5f5d','#f8cf49','#dff9fb','#703e52'),
 ('lime','#78b55b','#fbd17a','#f1fbde','#456b4a'),
 ('violet','#9671c9','#f5d58e','#f8edf9','#594782'),
 ('blue','#4a81d5','#ffe18c','#e9effc','#2b4689'),
]
for idx,(name,cover,hat,glass,shade) in enumerate(styles):
 extra = [
  '<path d="M14 53l-8 19v12l12 6 11-26" fill="#607f92" stroke="#151e2d" stroke-width="5"/>',
  '<path d="M68 56l14 10 0 22-13 4-12-27" fill="#e7c445" stroke="#151e2d" stroke-width="5"/>',
  '<path d="M74 65l8-2 4 22-9 5-10-20" fill="#8da6bc" stroke="#151e2d" stroke-width="5"/>',
  '<path d="M18 67l-12 5 4 18 12-3 5-19" fill="#d78943" stroke="#151e2d" stroke-width="5"/>',
  '<path d="M69 60l13 13-5 17-12-7" fill="#3b8ba6" stroke="#151e2d" stroke-width="5"/>',
  '<path d="M70 60l11 3-2 19-10 7-12-22" fill="#aabbd4" stroke="#151e2d" stroke-width="5"/>',
 ][idx]
 emblem=['⚡','★','+','●','◆','●'][idx]
 svg=f'''<svg width="88" height="112" viewBox="0 0 88 112" xmlns="http://www.w3.org/2000/svg">
 <ellipse cx="45" cy="104" rx="31" ry="6" fill="#101b31" opacity=".27"/>
 <!-- tool backpack -->{extra}
 <!-- boots -->
 <path d="M24 81l-3 19q-1 6 9 6h11l4-12 1-13" fill="{shade}" stroke="#101c2b" stroke-width="5" stroke-linejoin="round"/>
 <path d="M46 82l1 22h16q9 0 8-7l-6-19" fill="{shade}" stroke="#101c2b" stroke-width="5" stroke-linejoin="round"/>
 <!-- torso vest -->
 <path d="M21 46Q12 53 16 80q3 17 17 18h24Q72 96 72 78V57Q68 46 59 43" fill="{cover}" stroke="#101c2b" stroke-width="5" stroke-linejoin="round"/>
 <path d="M25 50L36 91h15l11-42" fill="none" stroke="{shade}" stroke-width="9" opacity=".48"/>
 <path d="M27 55l8 31h19l8-31" fill="none" stroke="{hat}" stroke-width="5" stroke-linejoin="round"/>
 <path d="M22 81h48" stroke="#182535" stroke-width="7"/>
 <path d="M34 79v10h20V79" fill="#bccbd6" stroke="#17253a" stroke-width="3"/>
 <circle cx="44" cy="84" r="3.5" fill="#3c4958"/>
 <!-- arms -->
 <path d="M21 51Q11 56 12 70l1 13 13 1 3-30" fill="{cover}" stroke="#101c2b" stroke-width="5" stroke-linejoin="round"/>
 <path d="M67 52q12 6 11 17v14l-13 3-4-31" fill="{cover}" stroke="#101c2b" stroke-width="5" stroke-linejoin="round"/>
 <path d="M12 76q6 5 15 0l-1 11q-4 7-13 1z M65 77q8 4 13-2l0 12q-5 7-13 1z" fill="{shade}" stroke="#101c2b" stroke-width="3"/>
 <!-- face -->
 <rect x="22" y="21" width="45" height="38" rx="16" fill="#f0b48e" stroke="#132232" stroke-width="5"/>
 <path d="M27 36q10-12 32 0" stroke="#865e4d" stroke-width="3" fill="none"/>
 <rect x="23" y="30" width="44" height="21" rx="9" fill="{glass}" stroke="#172536" stroke-width="4"/>
 <path d="M29 36l8-4 7 0-9 14" fill="#ffffff" opacity=".5"/>
 <path d="M50 40h8" stroke="#5f8492" stroke-width="3" stroke-linecap="round"/>
 <!-- industrial hard hat -->
 <path d="M16 31Q18 10 43 8 70 8 73 31l3 5H12z" fill="{hat}" stroke="#142333" stroke-width="5" stroke-linejoin="round"/>
 <path d="M43 10v23" stroke="{shade}" stroke-width="5" opacity=".5"/>
 <path d="M13 32h62" stroke="#fff2b0" stroke-width="5" stroke-linecap="round"/>
 <path d="M26 48q3 10 15 12h12" stroke="#fcddb0" stroke-width="3" opacity=".65" fill="none"/>
 </svg>'''
 (p/f'{name}.svg').write_text(svg)
 cairosvg.svg2png(bytestring=svg.encode(),write_to=str(p/f'{name}.png'),output_width=132,output_height=168)
 print('Wrote',name)
