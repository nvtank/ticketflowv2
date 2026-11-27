import contextlib
import io
import os
from pathlib import Path
from subprocess import CalledProcessError, CompletedProcess
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
            if os.name != 'nt':
                self.assertEqual(env.stat().st_mode & 0o777, 0o600)


class ComposeOverrideTests(unittest.TestCase):
    def setUp(self):
        self.out = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.enterContext(patch.object(quick_tunnel, 'OUT', self.out))
        self.runtime = self.out / 'runtime.env'
        self.runtime.write_text('STAGING_ORIGIN=https://localhost:3443\n')
        self.override = self.out / 'compose.override.yml'
        self.base = [
            'docker', 'compose', '--env-file', str(self.runtime), '-f',
            str(quick_tunnel.ROOT / 'infrastructure/docker-compose.staging.yml'),
        ]
        self.up = ['up', '-d', '--wait', '--no-build', 'api', 'web', 'gateway']

    def test_default_without_override_uses_only_the_base_file(self):
        with patch('sys.argv', ['quick_tunnel.py', 'stop']), patch.object(quick_tunnel, 'owned_container', return_value=None), \
                patch.object(quick_tunnel, 'run') as run, contextlib.redirect_stdout(io.StringIO()):
            quick_tunnel.main()
        run.assert_called_once_with(self.base + self.up)

    def test_stop_applies_conventional_override(self):
        self.override.touch()
        with patch('sys.argv', ['quick_tunnel.py', 'stop']), patch.object(quick_tunnel, 'owned_container', return_value=None), \
                patch.object(quick_tunnel, 'run') as run, contextlib.redirect_stdout(io.StringIO()):
            quick_tunnel.main()
        run.assert_called_once_with(self.base + ['-f', str(self.override)] + self.up)

    def test_start_and_rollback_reuse_explicit_layers_in_order(self):
        self.override.touch()
        db_override = self.out / 'database override.yml'
        image_override = self.out / 'image override.yml'
        db_override.touch()
        image_override.touch()
        prefix = self.base + ['-f', str(db_override), '-f', str(image_override)]
        url = 'https://fixture.trycloudflare.com'
        owned = {'State': {'Running': True}}
        argv = ['quick_tunnel.py', 'start', '--allow-public', '--compose-override',
                str(db_override), '--compose-override', str(image_override)]

        for scenario in ('new', 'existing', 'rollback'):
            with self.subTest(scenario=scenario):
                origins = []
                self.runtime.write_text('STAGING_ORIGIN=https://localhost:3443\n')

                def docker(command, **kwargs):
                    if command[:2] == ['docker', 'compose']:
                        self.assertEqual(command[:len(prefix)], prefix)
                        if command[len(prefix):] == self.up:
                            origins.append(self.runtime.read_text().strip().split('=', 1)[1])
                            if scenario == 'rollback' and len(origins) == 2:
                                raise CalledProcessError(1, command)
                    return CompletedProcess(command, 0, stdout=url, stderr='')

                with patch('sys.argv', argv), patch.object(quick_tunnel, 'owned_container',
                        side_effect=[owned] if scenario == 'existing' else [None, owned]), \
                        patch.object(quick_tunnel, 'run', side_effect=docker), \
                        patch.object(quick_tunnel.subprocess, 'run', side_effect=docker), \
                        contextlib.redirect_stdout(io.StringIO()):
                    if scenario == 'rollback':
                        with self.assertRaises(CalledProcessError):
                            quick_tunnel.main()
                    else:
                        quick_tunnel.main()

                expected = [url] if scenario == 'existing' else ['https://localhost:3443', url]
                if scenario == 'rollback':
                    expected.append('https://localhost:3443')
                self.assertEqual(origins, expected)

    def test_missing_override_fails_before_docker_or_origin_edit(self):
        before = self.runtime.read_bytes()
        argv = ['quick_tunnel.py', 'stop', '--compose-override', str(self.override)]
        with patch('sys.argv', argv), patch.object(quick_tunnel, 'owned_container') as inspect, \
                contextlib.redirect_stderr(io.StringIO()) as errors, self.assertRaises(SystemExit):
            quick_tunnel.main()
        self.assertIn('Compose override must be an existing file', errors.getvalue())
        self.assertEqual(self.runtime.read_bytes(), before)
        inspect.assert_not_called()


if __name__ == '__main__':
    unittest.main()
