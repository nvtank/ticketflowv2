import unittest
from sprint_evidence import browser_count, vitest_cases


class EvidenceIntegrityTests(unittest.TestCase):
    def test_refuses_missing_or_skipped_unit_tests(self):
        with self.assertRaises(ValueError):
            vitest_cases({'testResults': []}, {'auth-policy.test.ts'})
        with self.assertRaises(ValueError):
            vitest_cases({'testResults': [{'name': 'auth-policy.test.ts', 'status': 'passed',
                                          'assertionResults': [{'fullName': 'not executed', 'status': 'pending'}]}]},
                         {'auth-policy.test.ts'})

    def test_selects_only_required_observed_cases(self):
        report = {'testResults': [{'name': '/repo/auth-policy.test.ts', 'status': 'passed',
                                  'assertionResults': [{'fullName': 'real case', 'status': 'passed'}]},
                                 {'name': 'unrelated.test.ts', 'status': 'failed'}]}
        self.assertEqual(len(vitest_cases(report, {'auth-policy.test.ts'})), 1)

    def test_refuses_empty_failed_skipped_and_flaky_browser_runs(self):
        for stats in ({}, {'expected': 1, 'unexpected': 1}, {'expected': 1, 'skipped': 1},
                      {'expected': 1, 'flaky': 1}):
            with self.assertRaises(ValueError):
                browser_count({'stats': stats})
        self.assertEqual(browser_count({'stats': {'expected': 3, 'unexpected': 0, 'skipped': 0, 'flaky': 0}}), 3)


if __name__ == '__main__':
    unittest.main()
