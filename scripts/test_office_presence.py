import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('office_presence', Path(__file__).with_name('office-presence.py'))
office = importlib.util.module_from_spec(spec)
spec.loader.exec_module(office)


class PresenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.store = office.Store(self.root / 'state', [self.root / 'project'])
        (self.root / 'project').mkdir()
        self.store.set_enabled(True)

    def tearDown(self):
        self.tmp.cleanup()

    def event(self, key='session', **kw):
        return self.store.event(key, 'claude', kw.pop('action', 'start'), kw.pop('activity', 'working'), self.root / 'project', os.getpid(), **kw)

    def test_dedup_and_multiple_sessions(self):
        self.event(); self.event()
        self.event('second')
        self.assertEqual(len(self.store.snapshot()['sessions']), 2)

    def test_end_and_late_tool_do_not_reopen(self):
        self.event(); self.event(action='end'); self.event(action='update')
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_off_clears_and_does_not_restore(self):
        self.event(); self.store.set_enabled(False); self.event()
        self.assertEqual(self.store.snapshot()['sessions'], [])
        self.store.set_enabled(True)
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_only_allowed_workspace(self):
        self.store.event('x', 'local', 'start', 'working', self.root, os.getpid())
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_output_has_no_raw_identifiers_or_paths(self):
        self.event(key='SECRET-SESSION')
        output = json.dumps(self.store.snapshot())
        self.assertNotIn('SECRET', output)
        self.assertNotIn(str(self.root), output)
        self.assertNotIn('pid', output)

    def test_dead_or_reused_pid_exits(self):
        self.event()
        path = next(self.store.records.glob('*.json'))
        data = json.loads(path.read_text()); data['birth'] = 'wrong-birth'
        path.write_text(json.dumps(data))
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_waiting_stays_at_work_without_tool_events(self):
        self.event(); self.event(action='update', activity='waiting')
        self.assertEqual(self.store.snapshot()['sessions'][0]['activity'], 'waiting')

    def test_unknown_activity_never_reaches_public_file(self):
        self.event(activity='PRIVATE COMMAND')
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_claude_hook_turn_lifecycle_and_input_privacy(self):
        data = {'session_id': 'SECRET', 'cwd': str(self.root / 'project'),
                'prompt': 'PRIVATE', 'tool_input': {'file_path': '/private/secret'}}
        for kind, activity in [('UserPromptSubmit', 'working'), ('PreToolUse', 'editing'),
                               ('PermissionRequest', 'waiting'), ('PostToolUse', 'working')]:
            office.handle_hook(self.store, {**data, 'hook_event_name': kind, 'tool_name': 'Edit'}, os.getpid())
            snapshot = self.store.snapshot()
            self.assertEqual(snapshot['sessions'][0]['activity'], activity)
            self.assertNotIn('PRIVATE', json.dumps(snapshot))
        office.handle_hook(self.store, {**data, 'hook_event_name': 'Stop'}, os.getpid())
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_public_file_replaced_atomically_and_off_is_immediate(self):
        self.event(); self.store.publish()
        self.assertEqual(len(json.loads((self.store.public / 'status.json').read_text())['sessions']), 1)
        self.store.set_enabled(False)
        snapshot = json.loads((self.store.public / 'status.json').read_text())
        self.assertFalse(snapshot['enabled'])
        self.assertEqual(snapshot['sessions'], [])
        self.assertEqual(os.stat(self.store.records).st_mode & 0o777, 0o700)

    def test_explicit_public_title_is_kept_but_hook_prompt_is_not_used(self):
        self.event(public_title='Office 계절 테마 개선')
        self.assertEqual(self.store.snapshot()['sessions'][0]['publicTitle'], 'Office 계절 테마 개선')
        self.event(action='update')
        self.assertEqual(self.store.snapshot()['sessions'][0]['publicTitle'], 'Office 계절 테마 개선')

    def test_public_title_length_and_format(self):
        self.assertEqual(office.clean_public_title('  화면   개선  '), '화면 개선')
        for title in ['x'*49, '/home/private/key', '<script>', 'line\nbreak', 'token@example.com']:
            self.assertIsNone(office.clean_public_title(title))

    def test_hook_uses_only_explicit_environment_title(self):
        data = {'session_id': 'hook-title', 'cwd': str(self.root / 'project'),
                'hook_event_name': 'UserPromptSubmit', 'prompt': 'PRIVATE PROMPT',
                'publicTitle': 'PRIVATE RAW TITLE'}
        with patch.dict(os.environ, {'OFFICE_PUBLIC_TITLE': ''}):
            office.handle_hook(self.store, data, os.getpid())
        self.assertNotIn('publicTitle', self.store.snapshot()['sessions'][0])
        office.handle_hook(self.store, {**data, 'hook_event_name': 'Stop'}, os.getpid())
        with patch.dict(os.environ, {'OFFICE_PUBLIC_TITLE': '공개 작업 제목'}):
            office.handle_hook(self.store, data, os.getpid())
        self.assertEqual(self.store.snapshot()['sessions'][0]['publicTitle'], '공개 작업 제목')
        self.assertNotIn('PRIVATE', json.dumps(self.store.snapshot()))

    def test_project_uses_allowed_root_name_not_nested_working_directory(self):
        self.store.event('nested', 'local', 'start', 'testing', self.root / 'project' / 'frontend', os.getpid())
        self.assertEqual(self.store.snapshot()['sessions'][0]['projectName'], 'project')
        self.assertNotIn('frontend', json.dumps(self.store.snapshot()))

    def test_recent_project_survives_end_and_restart_without_becoming_attendance(self):
        with patch.object(office.time, 'time', return_value=100):
            self.event()
        self.event(action='end')
        again = office.Store(self.root / 'state', [self.root / 'project'])
        self.assertEqual(again.snapshot()['sessions'], [])
        self.assertEqual(again.snapshot()['recentProject'], {'projectName': 'project', 'lastActiveAt': 100000})
        again.publish()
        self.assertEqual(again.snapshot()['recentProject']['lastActiveAt'], 100000)

    def test_broadcast_off_erases_recent_project(self):
        self.event(); self.store.set_enabled(False)
        self.assertNotIn('recentProject', self.store.snapshot())
        self.store.set_enabled(True)
        self.assertNotIn('recentProject', self.store.snapshot())

    def test_latest_activity_wins_not_latest_end_or_disallowed_event(self):
        second = self.root / 'second_project'; second.mkdir()
        self.store.allowed.append(second)
        with patch.object(office.time, 'time', return_value=100): self.event()
        with patch.object(office.time, 'time', return_value=101):
            self.store.event('second', 'local', 'start', 'working', second, os.getpid())
        self.event(action='end')
        self.store.event('outside', 'local', 'start', 'working', self.root, os.getpid())
        self.assertEqual(self.store.snapshot()['recentProject'], {'projectName':'second_project', 'lastActiveAt':101000})

    def test_project_name_validation_and_recent_public_boundary(self):
        for value in ['/private/path', '..', 'a\nb', 'x'*65, '<secret>', 'mail@example.com']:
            self.assertIsNone(office.clean_project_name(value))
        self.assertEqual(office.clean_project_name('oracle_study-game'), 'oracle_study-game')
        self.event()
        path = self.store.records / 'recent-project'
        value = json.loads(path.read_text()); value['privatePath'] = 'PRIVATE'; path.write_text(json.dumps(value))
        self.assertNotIn('PRIVATE', json.dumps(self.store.snapshot()))
        self.assertEqual(os.stat(path).st_mode & 0o777, 0o600)

    def test_nested_allowlist_chooses_project_and_dead_process_keeps_recent(self):
        nested = self.root / 'project' / 'nested_game'
        self.store.allowed.append(nested)
        self.store.event('nested', 'local', 'start', 'working', nested / 'src', os.getpid())
        self.assertEqual(self.store.snapshot()['sessions'][0]['projectName'], 'nested_game')
        with patch.object(office, 'process_birth', return_value=None):
            snapshot = self.store.snapshot()
        self.assertEqual(snapshot['sessions'], [])
        self.assertEqual(snapshot['recentProject']['projectName'], 'nested_game')

    def test_old_turn_event_does_not_refresh_recent_activity(self):
        with patch.object(office.time, 'time', return_value=100): self.codex('UserPromptSubmit')
        with patch.object(office.time, 'time', return_value=101): self.codex('UserPromptSubmit', 'turn-b')
        self.codex('PermissionRequest', 'turn-a')
        self.codex('Stop', 'turn-a')
        self.assertEqual(self.store.snapshot()['recentProject']['lastActiveAt'], 101000)

    def test_corrupt_recent_file_does_not_break_live_snapshot(self):
        self.event()
        for value in ['[]', '{broken', '{"projectName":"project","lastActiveAt":true}']:
            (self.store.records / 'recent-project').write_text(value)
            snapshot = self.store.snapshot()
            self.assertEqual(len(snapshot['sessions']), 1)
            self.assertNotIn('recentProject', snapshot)

    def codex(self, kind, turn='turn-a', **extra):
        office.handle_codex_hook(self.store, {
            'session_id': 'PRIVATE-SESSION', 'turn_id': turn,
            'cwd': str(self.root / 'project'), 'hook_event_name': kind,
            'prompt': 'PRIVATE-PROMPT', 'transcript_path': '/private/transcript',
            'tool_response': 'PRIVATE-OUTPUT', **extra,
        }, os.getpid())

    def test_codex_turn_lifecycle_and_no_per_tool_employees(self):
        self.codex('UserPromptSubmit')
        for kind, tool, expected in [('PreToolUse', 'apply_patch', 'editing'),
                                     ('PermissionRequest', 'Bash', 'waiting'),
                                     ('PostToolUse', 'Bash', 'working')]:
            self.codex(kind, tool_name=tool)
            sessions = self.store.snapshot()['sessions']
            self.assertEqual(len(sessions), 1)
            self.assertEqual(sessions[0]['activity'], expected)
            self.assertEqual(sessions[0]['source'], 'codex')
            self.assertNotIn('PRIVATE', json.dumps(sessions))
        self.codex('Stop')
        self.codex('PostToolUse', tool_name='Bash')
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_codex_old_turn_cannot_end_or_update_new_turn(self):
        self.codex('UserPromptSubmit')
        self.codex('UserPromptSubmit', 'turn-b')
        self.codex('Stop')
        self.codex('PermissionRequest')
        self.assertEqual(self.store.snapshot()['sessions'][0]['activity'], 'working')
        self.codex('Interrupt', 'turn-b')
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_codex_session_end_and_off(self):
        self.codex('UserPromptSubmit')
        self.codex('SessionEnd', None)
        self.assertEqual(self.store.snapshot()['sessions'], [])
        self.codex('UserPromptSubmit', 'turn-b')
        self.store.set_enabled(False)
        self.store.set_enabled(True)
        self.codex('PreToolUse', 'turn-b', tool_name='Bash')
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_codex_needs_valid_turn_and_workspace(self):
        self.codex('UserPromptSubmit', None)
        self.codex('UserPromptSubmit', cwd=str(self.root))
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_codex_does_not_take_title_from_prompt(self):
        with patch.dict(os.environ, {'OFFICE_PUBLIC_TITLE': ''}):
            self.codex('UserPromptSubmit', publicTitle='PRIVATE-TITLE')
        self.assertNotIn('publicTitle', self.store.snapshot()['sessions'][0])
        private = ''.join(p.read_text() for p in self.store.records.glob('*.json'))
        self.assertNotIn('PRIVATE', private)


    def codex_cli(self, directory, session, kind='UserPromptSubmit', allowed=None):
        args = ['office-presence.py', '--state-dir', str(self.root / 'state')]
        if allowed is not None:
            args += ['--allow-project', str(allowed)]
        args += ['codex-hook']
        data = {'session_id': session, 'turn_id': 'turn-a', 'cwd': str(directory),
                'hook_event_name': kind}
        with patch.object(office, 'ROOT', self.root / 'project'):
            with patch.object(office.sys, 'argv', args), patch.object(office.sys, 'stdin', io.StringIO(json.dumps(data))):
                with patch.object(office, 'agent_parent', return_value=os.getpid()):
                    office.main()

    def test_explicit_second_project_hook_shares_attendance_without_merging_sessions(self):
        second = self.root / 'second-project'; second.mkdir()
        self.codex_cli(self.root / 'project', 'PRIVATE-FIRST')
        self.codex_cli(second, 'PRIVATE-SECOND', allowed=second)
        self.codex_cli(second, 'PRIVATE-SECOND', 'PostToolUse', allowed=second)
        sessions = self.store.snapshot()['sessions']
        self.assertEqual(len(sessions), 2)
        self.assertEqual({s['projectName'] for s in sessions}, {'project', 'second-project'})
        self.assertNotIn(str(self.root), json.dumps(sessions))
        self.assertNotIn('PRIVATE', json.dumps(sessions))
        self.codex_cli(second, 'PRIVATE-SECOND', 'Stop', allowed=second)
        self.assertEqual(len(self.store.snapshot()['sessions']), 1)
        self.assertEqual(self.store.snapshot()['sessions'][0]['projectName'], 'project')

    def test_second_project_is_not_implicitly_allowed(self):
        second = self.root / 'second-project'; second.mkdir()
        self.codex_cli(second, 'PRIVATE-SECOND')
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_explicit_project_does_not_allow_other_sibling_projects(self):
        second = self.root / 'second-project'; second.mkdir()
        third = self.root / 'third-project'; third.mkdir()
        self.codex_cli(third, 'PRIVATE-THIRD', allowed=second)
        self.assertEqual(self.store.snapshot()['sessions'], [])

    def test_explicit_project_requires_existing_absolute_directory(self):
        for invalid in ['relative-project', self.root / 'missing', self.root / 'file']:
            (self.root / 'file').touch()
            with self.subTest(invalid=invalid), patch.object(office.sys, 'stderr', io.StringIO()):
                with self.assertRaises(SystemExit):
                    self.codex_cli(self.root / 'project', 'PRIVATE', allowed=invalid)


if __name__ == '__main__':
    unittest.main()
