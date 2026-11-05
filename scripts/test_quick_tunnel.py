import contextlib
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import quick_tunnel


class PublicExposureGuards(unittest.TestCase):
    def test_start_without_explicit_flag_never_contacts_docker(self):
        with patch('sys.argv', ['quick_tunnel.py', 'start']), patch.object(quick_tunnel, 'owned_container') as inspect:
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                quick_tunnel.main()
            inspect.assert_not_called()

    def test_rejects_unowned_container_name_collision(self):
        result = type('Result', (), {'returncode': 0, 'stdout': '[{"Config":{"Labels":{}}}]'})()
        with patch.object(quick_tunnel.subprocess, 'run', return_value=result):
            with self.assertRaisesRegex(RuntimeError, 'unowned'):
                quick_tunnel.owned_container()

    def test_origin_update_preserves_keys_and_rejects_injection(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(quick_tunnel, 'OUT', Path(directory)):
            env = Path(directory) / 'runtime.env'
            env.write_text('STAGING_JWT_SECRET=test-fixture-only\nSTAGING_ORIGIN=https://localhost:3443\n')
            for origin in ['http://example.com', 'https://example.com', 'https://user:pass@demo.trycloudflare.com',
                           'https://demo.trycloudflare.com/path', 'https://demo.trycloudflare.com\nINJECT=yes']:
                with self.assertRaises(ValueError):
                    quick_tunnel.set_origin(origin)
            quick_tunnel.set_origin('https://demo.trycloudflare.com')
            self.assertIn('STAGING_JWT_SECRET=test-fixture-only', env.read_text())
            self.assertEqual(env.read_text().count('STAGING_ORIGIN='), 1)
            self.assertEqual(env.stat().st_mode & 0o777, 0o600)


if __name__ == '__main__':
    unittest.main()
