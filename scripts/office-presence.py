#!/usr/bin/env python3
"""Opt-in local Office presence. No tool input, output or chat text is stored."""
import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import uuid
import unicodedata

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / '.office-presence'
SOURCES = {'claude', 'codex', 'local'}
ACTIVITIES = {'working', 'reading', 'editing', 'running', 'testing', 'waiting'}


def clean_public_title(value):
    if not isinstance(value, str) or any(unicodedata.category(ch).startswith('C') for ch in value):
        return None
    value = ' '.join(unicodedata.normalize('NFC', value).split())
    if not 1 <= len(value) <= 48:
        return None
    if any(unicodedata.category(ch)[0] not in 'LNM' and ch not in " .,!?'()·+-" for ch in value):
        return None
    return value


def clean_project_name(value):
    if not isinstance(value, str) or any(unicodedata.category(ch).startswith('C') for ch in value):
        return None
    value = unicodedata.normalize('NFC', value).strip()
    if not 1 <= len(value) <= 64 or value in {'.', '..'}:
        return None
    if any(unicodedata.category(ch)[0] not in 'LNM' and ch not in ' ._()-' for ch in value):
        return None
    return value


def process_birth(pid):
    """Linux start ticks distinguish reused PIDs; zombies are no longer active."""
    try:
        fields = Path(f'/proc/{int(pid)}/stat').read_text().rsplit(')', 1)[1].split()
        return fields[19] if fields[0] != 'Z' else None
    except (OSError, ValueError, IndexError):
        return None


def atomic_json(path, data, mode=0o600):
    tmp = path.with_name(f'.{path.name}.{uuid.uuid4().hex}.tmp')
    try:
        with os.fdopen(os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode), 'w') as handle:
            json.dump(data, handle, separators=(',', ':'))
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


class Store:
    def __init__(self, directory=STATE, allowed=None):
        self.directory = Path(directory)
        self.records = self.directory / 'private'
        self.public = self.directory / 'public'
        self.records.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.public.mkdir(parents=True, exist_ok=True, mode=0o755)
        os.chmod(self.records, 0o700)
        self.allowed = [Path(p).resolve() for p in (allowed or [ROOT])]

    @contextmanager
    def locked(self):
        with (self.records / 'lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            yield

    def enabled(self):
        return (self.records / 'enabled').exists()

    def set_enabled(self, enabled):
        with self.locked():
            if enabled:
                (self.records / 'enabled').touch(mode=0o600)
            else:
                (self.records / 'enabled').unlink(missing_ok=True)
                (self.records / 'recent-project').unlink(missing_ok=True)
                for path in self.records.glob('*.json'):
                    path.unlink(missing_ok=True)
        self.publish()

    def event(self, key, source, action, activity, cwd, pid, public_title=None, turn_token=None):
        if source not in SOURCES or activity not in ACTIVITIES or action not in {'start', 'update', 'end'}:
            return
        cwd = Path(cwd).resolve()
        roots = [root for root in self.allowed if cwd == root or root in cwd.parents]
        if not roots:
            return
        project = clean_project_name(max(roots, key=lambda root: len(root.parts)).name)
        path = self.records / (hashlib.sha256(f'{source}:{key}'.encode()).hexdigest() + '.json')
        with self.locked():
            if path.exists() and turn_token and action != 'start':
                if json.loads(path.read_text()).get('turnToken') != turn_token:
                    return
            if action == 'end':
                path.unlink(missing_ok=True)
                return
            birth = process_birth(pid)
            if not self.enabled() or not birth:
                return
            if path.exists():
                record = json.loads(path.read_text())
                if record['pid'] != pid or record['birth'] != birth:
                    path.unlink(missing_ok=True)
                    return
            elif action == 'start':
                if len(list(self.records.glob('*.json'))) >= 24:
                    return
                record = {'id': str(uuid.uuid4()), 'source': source,
                          'startedAt': int(time.time() * 1000), 'pid': pid, 'birth': birth}
            else:
                return  # Delayed tool events cannot reopen a completed turn.
            if action == 'start' and not record.get('publicTitle'):
                title = clean_public_title(public_title)
                if title:
                    record['publicTitle'] = title
            if turn_token:
                record['turnToken'] = turn_token
            record['activity'] = activity
            if project:
                record['projectName'] = project
            else:
                record.pop('projectName', None)
            atomic_json(path, record)
            if project:
                atomic_json(self.records / 'recent-project', {
                    'projectName': project, 'lastActiveAt': int(time.time() * 1000),
                })

    def snapshot(self):
        with self.locked():
            return self._snapshot()

    def _snapshot(self):
        sessions = []
        enabled = self.enabled()
        for path in self.records.glob('*.json'):
            try:
                item = json.loads(path.read_text())
                if not enabled or process_birth(item['pid']) != item['birth']:
                    path.unlink(missing_ok=True)
                    continue
                if item['source'] not in SOURCES or item['activity'] not in ACTIVITIES:
                    continue
                uuid.UUID(item['id'])
                session = {k: item[k] for k in ('id', 'source', 'activity', 'startedAt')}
                title = clean_public_title(item.get('publicTitle'))
                if title:
                    session['publicTitle'] = title
                project = clean_project_name(item.get('projectName'))
                if project:
                    session['projectName'] = project
                sessions.append(session)
            except (OSError, ValueError, KeyError, TypeError):
                continue
        snapshot = {'version': 1, 'updatedAt': int(time.time() * 1000), 'enabled': enabled,
                    'sessions': sorted(sessions, key=lambda s: (s['startedAt'], s['id']))[:24]}
        if enabled:
            try:
                recent = json.loads((self.records / 'recent-project').read_text())
                project = clean_project_name(recent.get('projectName'))
                active_at = recent.get('lastActiveAt')
                if project and type(active_at) is int and 0 <= active_at <= snapshot['updatedAt']:
                    snapshot['recentProject'] = {'projectName': project, 'lastActiveAt': active_at}
            except (OSError, ValueError, TypeError, AttributeError):
                pass
        return snapshot

    def publish(self):
        with self.locked():
            atomic_json(self.public / 'status.json', self._snapshot(), 0o644)


def agent_parent(name):
    """Ancestor executable names only, never arguments or transcripts."""
    pid = os.getppid()
    for _ in range(12):
        try:
            comm = Path(f'/proc/{pid}/comm').read_text().strip().lower()
            exe = Path(os.readlink(f'/proc/{pid}/exe')).name.lower()
            if comm == name or exe == name:
                return pid
            stat = Path(f'/proc/{pid}/stat').read_text().rsplit(')', 1)[1].split()
            pid = int(stat[1])
            if pid <= 1:
                break
        except (OSError, ValueError, IndexError):
            break
    return None


def handle_hook(store, data, pid=None):
    kind = data.get('hook_event_name')
    actions = {'UserPromptSubmit': 'start', 'PreToolUse': 'update',
               'PostToolUse': 'update', 'PostToolUseFailure': 'update',
               'PermissionRequest': 'update', 'Stop': 'end', 'SessionEnd': 'end',
               'StopFailure': 'end'}
    if kind not in actions or not isinstance(data.get('session_id'), str) or not data.get('cwd'):
        return
    activity = 'working'
    if kind == 'PreToolUse':
        activity = {'Read': 'reading', 'Grep': 'reading', 'Glob': 'reading',
                    'Edit': 'editing', 'Write': 'editing', 'Bash': 'running',
                    'AskUserQuestion': 'waiting'}.get(data.get('tool_name'), 'working')
    elif kind == 'PermissionRequest':
        activity = 'waiting'
    parent = pid or agent_parent('claude')
    if parent:
        store.event(data['session_id'], 'claude', actions[kind], activity, data['cwd'], parent, os.environ.get('OFFICE_PUBLIC_TITLE'))


def handle_codex_hook(store, data, pid=None):
    """Official lifecycle metadata only. Never open transcript_path or tool inputs."""
    kind = data.get('hook_event_name')
    actions = {'UserPromptSubmit': 'start', 'PreToolUse': 'update',
               'PostToolUse': 'update', 'PermissionRequest': 'update',
               'Stop': 'end', 'Interrupt': 'end', 'SessionEnd': 'end'}
    session = data.get('session_id')
    turn = data.get('turn_id')
    # Local health receipt: booleans/enums only, never raw input or identifiers.
    cwd_value = data.get('cwd')
    candidate = Path(cwd_value).resolve() if isinstance(cwd_value, str) and cwd_value else None
    parent = pid or agent_parent('codex')
    atomic_json(store.records / 'codex-hook-health', {
        'updatedAt': int(time.time()*1000), 'event': kind if kind in actions else 'unknown',
        'hasSession': isinstance(session,str) and bool(session),
        'hasTurn': isinstance(turn,str) and bool(turn),
        'workspaceAllowed': candidate is not None and any(candidate==r or r in candidate.parents for r in store.allowed),
        'parentFound': parent is not None,
    })

    if kind not in actions or not isinstance(session, str) or not session or not isinstance(data.get('cwd'), str):
        return
    if kind != 'SessionEnd' and (not isinstance(turn, str) or not turn):
        return
    if not parent:
        return
    activity = 'working'
    if kind == 'PermissionRequest':
        activity = 'waiting'
    elif kind == 'PreToolUse':
        activity = {'Bash': 'running', 'apply_patch': 'editing',
                    'Read': 'reading', 'Grep': 'reading', 'Glob': 'reading'}.get(data.get('tool_name'), 'working')
    token = hashlib.sha256(turn.encode()).hexdigest() if kind != 'SessionEnd' else None
    store.event(session, 'codex', actions[kind], activity, data['cwd'], parent,
                os.environ.get('OFFICE_PUBLIC_TITLE'), turn_token=token)


def serve(store):
    with (store.records / 'daemon.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        while True:
            store.publish()
            time.sleep(2)


def run_task(store, source, activity, command, public_title=None):
    if command[:1] == ['--']:
        command = command[1:]
    if not command:
        raise ValueError('실행할 명령이 필요합니다.')
    key = uuid.uuid4().hex
    nested = os.environ.get('OFFICE_PRESENCE_TASK') == '1'
    child = subprocess.Popen(command, env={**os.environ, 'OFFICE_PRESENCE_TASK': '1'})
    previous = {}
    for sig in (signal.SIGTERM, signal.SIGINT):
        previous[sig] = signal.signal(sig, lambda signum, frame: child.send_signal(signum) if child.poll() is None else None)
    try:
        if not nested:
            store.event(key, source, 'start', activity, Path.cwd(), child.pid, public_title)
        return child.wait()
    finally:
        if not nested:
            store.event(key, source, 'end', activity, Path.cwd(), child.pid)
        for sig, handler in previous.items():
            signal.signal(sig, handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir', type=Path, default=STATE)
    parser.add_argument('--allow-project', type=Path, action='append', default=[],
                        help='명시적으로 연결할 추가 프로젝트의 절대 경로 (반복 가능)')
    sub = parser.add_subparsers(dest='mode', required=True)
    for mode in ('on', 'off', 'status', 'serve', 'hook', 'codex-hook'):
        sub.add_parser(mode)
    run = sub.add_parser('run')
    run.add_argument('--source', choices=sorted(SOURCES), default='local')
    run.add_argument('--activity', choices=sorted(ACTIVITIES), default='running')
    run.add_argument('--public-title', type=clean_public_title, help='공개 칠판 제목 (최대 48자, 생략 시 일반 상태)')
    run.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    for project in args.allow_project:
        if not project.is_absolute() or not project.is_dir() or not clean_project_name(project.resolve().name):
            parser.error('--allow-project에는 존재하는 프로젝트 디렉터리의 절대 경로가 필요합니다.')
    store = Store(args.state_dir, [ROOT, *args.allow_project])
    if args.mode in {'on', 'off'}:
        store.set_enabled(args.mode == 'on')
        print('Office 방송 ' + ('켜짐' if store.enabled() else '꺼짐'))
    elif args.mode == 'status':
        print(json.dumps(store.snapshot(), ensure_ascii=False, indent=2))
    elif args.mode == 'serve':
        serve(store)
    elif args.mode in {'hook', 'codex-hook'}:
        try:
            if os.environ.get('OFFICE_PRESENCE_TASK') != '1':
                handler = handle_codex_hook if args.mode == 'codex-hook' else handle_hook
                data = json.loads(sys.stdin.read(1_048_576))
                if isinstance(data, dict):
                    handler(store, data)
        except (OSError, ValueError, TypeError, KeyError):
            pass
    elif args.mode == 'run':
        return run_task(store, args.source, args.activity, args.command, args.public_title)
    return 0


if __name__ == '__main__':
    sys.exit(main())
