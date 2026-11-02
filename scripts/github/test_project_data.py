import unittest
from project_data import history_series


def row(number, created, state='open', events=None, closed_at=None):
    return {'number':number, 'created_at':created, 'state':state, 'events':events or [], 'closed_at':closed_at}


class ActualBurndownTests(unittest.TestCase):
    def test_close_reopen_is_reconstructed_from_events_not_current_state_alone(self):
        issue = row(1, '2026-11-02T09:00:00Z', events=[
            {'event':'closed', 'created_at':'2026-11-02T10:00:00Z'},
            {'event':'reopened', 'created_at':'2026-11-02T11:00:00Z'},
        ])
        points = history_series([issue], '2026-11-02T12:00:00Z')
        self.assertEqual([p['remaining_issues'] for p in points], [1, 0, 1, 1])

    def test_no_points_are_invented_before_creation(self):
        points = history_series([row(1, '2026-11-02T09:00:00Z')], '2026-11-02T12:00:00Z')
        self.assertEqual(points[0]['timestamp'], '2026-11-02T09:00:00Z')
        self.assertFalse(any(p['timestamp'].startswith('2026-09') for p in points))

    def test_duplicate_close_does_not_burn_twice_and_closed_at_fallback_is_real(self):
        a = row(1, '2026-11-02T09:00:00Z', 'closed', [
            {'event':'closed', 'created_at':'2026-11-02T10:00:00Z'},
            {'event':'closed', 'created_at':'2026-11-02T10:01:00Z'},
        ], '2026-11-02T10:01:00Z')
        b = row(2, '2026-11-02T09:30:00Z', 'closed', closed_at='2026-11-02T11:00:00Z')
        points = history_series([a,b], '2026-11-02T12:00:00Z')
        self.assertEqual(points[-1]['remaining_issues'], 0)
        self.assertEqual(points[-1]['scope_issues'], 2)
        self.assertTrue(all(p['remaining_issues'] >= 0 for p in points))

    def test_mismatched_snapshot_fails_instead_of_fabricating_progress(self):
        with self.assertRaises(ValueError):
            history_series([row(1, '2026-11-02T09:00:00Z', 'closed')], '2026-11-02T12:00:00Z')


if __name__ == '__main__':
    unittest.main()
