"""Deployment readiness checks that do not require an account or network."""
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class DeploymentConfigTests(unittest.TestCase):
    def test_public_backend_matches_spacetime_config(self):
        cfg=json.loads((ROOT/'spacetime.json').read_text())
        env=dict(line.split('=',1) for line in (ROOT/'.env.production').read_text().splitlines() if line and not line.startswith('#'))
        self.assertEqual(cfg['database'],env['VITE_SPACETIMEDB_DB_NAME'])
        self.assertEqual(env['VITE_SPACETIMEDB_HOST'],'https://maincloud.spacetimedb.com')
    def test_development_does_not_target_live_database(self):
        prod=json.loads((ROOT/'spacetime.json').read_text())
        dev=json.loads((ROOT/'spacetime.dev.json').read_text())
        self.assertNotEqual(prod['database'],dev['database'])
    def test_binding_generation_target(self):
        cfg=json.loads((ROOT/'spacetime.json').read_text())
        self.assertEqual(cfg['generate'][0]['out-dir'],'./src/module_bindings')
    def test_vercel_has_spa_fallback_and_pinned_build(self):
        cfg=json.loads((ROOT/'vercel.json').read_text())
        self.assertEqual(cfg['buildCommand'],'npm run build:public')
        self.assertEqual(cfg['outputDirectory'],'dist')
        self.assertEqual(cfg['rewrites'][0]['destination'],'/index.html')
    def test_static_netlify_deployment(self):
        t=(ROOT/'netlify.toml').read_text()
        self.assertIn('npm run build:public',t)
        self.assertIn('publish = "dist"',t)
        self.assertIn('status = 200',t)
    def test_windows_cli_diagnostic_exists(self):
        t=(ROOT/'CHECK_SETUP_WINDOWS.cmd').read_text()
        self.assertIn('where spacetime',t)
        self.assertIn('npm.cmd --version',t)
    def test_no_uploaded_private_env(self):
        self.assertFalse((ROOT/'.env.local').exists())

if __name__=='__main__':unittest.main()
