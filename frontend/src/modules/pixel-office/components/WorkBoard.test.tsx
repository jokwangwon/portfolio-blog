import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkBoard } from "./WorkBoard";
import type { PresenceSnapshot } from "../presence/presence";
const snapshot: PresenceSnapshot = { connection: "connected", enabled: true, updatedAt: 1,
  sessions: [{id:"a",source:"claude",activity:"editing",startedAt:1,publicTitle:"Office 계절 테마 개선"}] };
describe("public work board", () => {
  it("shows the deliberately public title alongside actual activity", () => {
    render(<WorkBoard presence={snapshot}/>);
    expect(screen.getByText("Office 계절 테마 개선")).toBeInTheDocument();
    expect(screen.getByText("코드 수정 중")).toBeInTheDocument();
  });
  it("falls back to activity when a title is not supplied", () => {
    render(<WorkBoard presence={{...snapshot,sessions:[{...snapshot.sessions[0],publicTitle:undefined}]}}/>);
    expect(screen.getAllByText("코드 수정 중").length).toBeGreaterThan(0);
  });
  it("never presents stale titles as current work while disconnected", () => {
    render(<WorkBoard presence={{...snapshot,connection:"unavailable"}}/>);
    expect(screen.queryByText("Office 계절 테마 개선")).not.toBeInTheDocument();
    expect(screen.getByText("작업 현황을 확인하고 있습니다")).toBeInTheDocument();
  });
  it("clears the board when broadcasting is off", () => {
    render(<WorkBoard presence={{...snapshot,enabled:false}}/>);
    expect(screen.queryByText("Office 계절 테마 개선")).not.toBeInTheDocument();
    expect(screen.getByText("잠시 쉬어가는 중")).toBeInTheDocument();
  });
});

it("groups current sessions by project and keeps session selection", () => {
  const onSelect = vi.fn();
  render(<WorkBoard onSelect={onSelect} presence={{...snapshot, sessions:[
    {...snapshot.sessions[0], projectName:"portfolio-blog"},
    {...snapshot.sessions[0], id:"b", source:"codex", projectName:"portfolio-blog", publicTitle:"기록 화면 정리"},
  ]}}/>);
  expect(screen.getAllByRole("heading", {name:"portfolio-blog"})).toHaveLength(1);
  expect(screen.getByRole("button", {name:/기록 화면 정리/})).toBeInTheDocument();
  expect(screen.getByText("진행 중인 작업 2개")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {name:/기록 화면 정리/}));
  expect(onSelect).toHaveBeenCalledWith("b");
});
it("shows recent work only during confirmed idle and never marks it as ongoing", () => {
  const recentProject={projectName:"oracle_study",lastActiveAt:1800000000000};
  const {rerender}=render(<WorkBoard presence={{...snapshot,sessions:[],recentProject}}/>);
  expect(screen.getByRole("heading",{name:"최근 작업"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"oracle_study"})).toBeInTheDocument();
  expect(screen.getByText("지금은 쉬는 중")).toBeInTheDocument();
  expect(screen.queryByText(/진행 중인 작업/)).not.toBeInTheDocument();
  for(const override of [{sessions:snapshot.sessions},{enabled:false},{connection:"unavailable" as const}]){
    rerender(<WorkBoard presence={{...snapshot,sessions:[],recentProject,...override}}/>);
    expect(screen.queryByRole("heading",{name:"oracle_study"})).not.toBeInTheDocument();
  }
});
