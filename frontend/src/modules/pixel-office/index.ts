// Pixel Office Module — Public API
export { default as OfficeCanvas } from "./components/OfficeCanvas";
export { EventMapper } from "./engine/EventMapper";
export { OfficeState } from "./pixel-engine/engine/officeState";
export { loadPixelOfficeAssets } from "./pixel-engine/assetLoader";
export type { Character, OfficeLayout, SpriteData } from "./pixel-engine/types";
export type { GitHubEvent, GitHubEventType, AgentStatusUpdate } from "./types/office.types";
