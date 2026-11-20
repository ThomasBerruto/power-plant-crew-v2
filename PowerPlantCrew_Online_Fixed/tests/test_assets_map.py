"""Offline checks that run without npm or the SpacetimeDB service."""
import json
import math
import re
import unittest
from collections import deque
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
CLIENT = (ROOT/'src/plantMap.ts').read_text()
SERVER = (ROOT/'spacetimedb/src/plantMap.ts').read_text()


def rectangle_group(name):
    raw = CLIENT.split(f'export const {name} = [', 1)[1].split('] as const', 1)[0]
    return [tuple(int(z.strip()) for z in x.split(',')) for x in re.findall(r'\[([\d ,]+)\]', raw)]


WALKABLE = rectangle_group('WALK_ZONES')
OBSTACLES = rectangle_group('OBSTACLES')
CONSOLES = [(name,int(x),int(y)) for name,x,y in re.findall(r"id: '([^']+)'.*?x: (\d+), y: (\d+)",CLIENT)]


def can_stand(x,y):
    r=15
    offsets=((0,0),(r,0),(-r,0),(0,r),(0,-r),(.7*r,.7*r),(.7*r,-.7*r),(-.7*r,.7*r),(-.7*r,-.7*r))
    def indoor(px,py):return any(a<=px<=c and b<=py<=d for a,b,c,d in WALKABLE)
    return all(indoor(x+dx,y+dy) for dx,dy in offsets) and not any(x+r>a and x-r<c and y+r>b and y-r<d for a,b,c,d in OBSTACLES)


class IntegrationSanity(unittest.TestCase):
    def test_same_server_client_geometry(self):
        self.assertEqual(CLIENT,SERVER)

    def test_map_dimensions(self):
        raw=(ROOT/'public/assets/power-plant-map.png').read_bytes()
        self.assertEqual(raw[:8],b'\x89PNG\r\n\x1a\n')
        self.assertEqual(struct.unpack('>II',raw[16:24]),(1536,1024))

    def test_original_technicians_exist(self):
        for name in ['amber','cyan','ruby','lime','violet','blue']:
            raw=(ROOT/f'public/assets/technicians/{name}.png').read_bytes()
            self.assertEqual(raw[:8],b'\x89PNG\r\n\x1a\n')
            self.assertEqual(struct.unpack('>II',raw[16:24]),(132,168))

    def test_all_five_stations_are_reachable(self):
        self.assertEqual(len(CONSOLES),5)
        start=(765,531)
        self.assertTrue(can_stand(*start))
        q=deque([start]);visited={start}
        while q:
            x,y=q.popleft()
            for dx,dy in ((8,0),(-8,0),(0,8),(0,-8)):
                node=(x+dx,y+dy)
                if node not in visited and can_stand(*node):
                    visited.add(node);q.append(node)
        for name,x,y in CONSOLES:
            self.assertTrue(any(math.hypot(a-x,b-y)<55 for a,b in visited),f'{name} inaccessible')

    def test_server_task_ids_match_minigame_registry(self):
        registry=(ROOT/'src/minigames/registry.ts').read_text()
        for name,_,_ in CONSOLES:
            self.assertRegex(registry,rf'\b{name}:')
        server=(ROOT/'spacetimedb/src/index.ts').read_text()
        for reducer in ['createRoom','joinRoom','movePlayer','leaveRoom','startShift','finishTask']:
            self.assertIn('export const '+reducer,server)
        bindings=(ROOT/'src/module_bindings/index.ts').read_text()
        for reducer in ['create_room','join_room','move_player','leave_room','start_shift','finish_task']:
            self.assertIn(f'__reducerSchema("{reducer}"',bindings)

    def test_cloud_configuration(self):
        config=json.loads((ROOT/'spacetime.json').read_text())
        self.assertEqual(config['server'],'maincloud')
        self.assertEqual(config['module-path'],'./spacetimedb')
        self.assertFalse((ROOT/'.env.local').exists(),'Do not package personal deployment settings')


if __name__=='__main__':unittest.main()
