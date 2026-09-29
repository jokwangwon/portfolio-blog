import Link from "next/link";
import { ACTIVITY_LABELS, SOURCE_LABELS, type PresenceSession, type PresenceSnapshot } from "../presence/presence";
import styles from "./office.module.css";

export function WorkBoard({ presence, onSelect }: { presence: PresenceSnapshot; onSelect?: (id: string) => void }) {
  const available = presence.connection === "connected" && presence.enabled;
  const sessions = available ? presence.sessions : [];
  const recent = available && !sessions.length ? presence.recentProject : undefined;
  const groups = new Map<string, PresenceSession[]>();
  for (const session of sessions) {
    const name = session.projectName || "작업 세션";
    groups.set(name, [...(groups.get(name) || []), session]);
  }
  const message = presence.connection !== "connected" ? "작업 현황을 확인하고 있습니다"
    : !presence.enabled ? "잠시 쉬어가는 중" : "아직 작업 기록이 없습니다";
  return <aside className={styles.board} aria-label="현재 작업 칠판">
    <div className={styles.boardHeading}><span className={styles.pin}/><span>{sessions.length ? "NOW WORKING" : recent ? "LAST WORKED ON" : "WORK NOTES"}</span><span className={styles.pin}/></div>
    <h2>{sessions.length ? "지금 하는 일" : recent ? "최근 작업" : "작업 칠판"}</h2>
    <div className={styles.chalkRule}/>
    {sessions.length > 0 ? <ol className={styles.notes}>
      {[...groups].map(([name, items]) => <li key={name}>
        <h3 className={styles.projectName}>{name}</h3>
        {items.map((session) => <button key={session.id} onClick={()=>onSelect?.(session.id)} className={styles.note}>
          <span className={styles.noteBody}>
            <span className={styles.noteTitle}>{session.publicTitle || ACTIVITY_LABELS[session.activity]}</span>
            <span className={styles.noteMeta}>{SOURCE_LABELS[session.source]}<span aria-hidden="true"> · </span><span>{session.publicTitle ? ACTIVITY_LABELS[session.activity] : "진행 중"}</span></span>
          </span>
        </button>)}
      </li>)}
    </ol> : recent ? <div className={styles.emptyBoard}>
      <h3 className={styles.projectName}>{recent.projectName}</h3>
      <p className={styles.emptyHint}>마지막 활동 <time dateTime={new Date(recent.lastActiveAt).toISOString()}>{new Intl.DateTimeFormat("ko-KR", {timeZone:"Asia/Seoul", year:"numeric", month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false}).format(recent.lastActiveAt)}</time></p>
    </div> : <div className={styles.emptyBoard}><span className={styles.chalkDash} aria-hidden="true">—</span><p>{message}</p>
      <p className={styles.emptyHint}>{presence.connection !== "connected" ? "연결되면 새 소식을 적어둘게요." : "다음 작업이 시작되면 여기에 적어둘게요."}</p></div>}
    <div className={styles.boardFooter}>{sessions.length ? `진행 중인 작업 ${sessions.length}개` : recent ? "지금은 쉬는 중" : "잠시 숨을 고르는 시간"}<span aria-hidden="true">✳</span></div>
    <div className={styles.boardLinks}>
      <Link href="/blog" className={styles.boardLink}>기록 보기 <span aria-hidden="true">↗</span></Link>
      <Link href="/#projects" className={styles.boardLink}>프로젝트 보기 <span aria-hidden="true">↗</span></Link>
    </div>
    <div className={styles.chalkTray} aria-hidden="true"><i/><i/><b/></div>
  </aside>;
}
