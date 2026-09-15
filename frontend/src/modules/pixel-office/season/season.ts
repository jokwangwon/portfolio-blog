export type Season = "spring" | "summer" | "autumn" | "winter";
export const SEASONS = {
  spring: { label: "봄", caption: "꽃이 피는 창가", sky: "#dcefe4", leaf: "#eeb6c5", shade: "#bf829f", ground: "#99b28b", accent: "#b97088", wall: "#ead9df" },
  summer: { label: "여름", caption: "초록이 짙어지는 오후", sky: "#c5e9ed", leaf: "#59966b", shade: "#347155", ground: "#83ab70", accent: "#397d73", wall: "#c8ded7" },
  autumn: { label: "가을", caption: "단풍이 머무는 창가", sky: "#f1dfbf", leaf: "#cc8149", shade: "#a7543d", ground: "#bb9b67", accent: "#a86740", wall: "#e5cdb4" },
  winter: { label: "겨울", caption: "눈 덮인 조용한 창가", sky: "#d4e1ec", leaf: "#e9f1f5", shade: "#9aafbd", ground: "#eff4f5", accent: "#648298", wall: "#cddce6" },
} satisfies Record<Season, Record<string, string>>;

export function officeCalendar(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (key: string) => parts.find(p => p.type === key)!.value;
  const month = Number(value("month"));
  const season: Season = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  return { season, night: Number(value("hour")) < 6 || Number(value("hour")) >= 19, date: `${value("year")}-${value("month")}-${value("day")}`,
    month: value("month"), day: value("day"),
    label: new Intl.DateTimeFormat("ko-KR", {timeZone:"Asia/Seoul", year:"numeric", month:"long",day:"numeric",weekday:"short"}).format(date) };
}
