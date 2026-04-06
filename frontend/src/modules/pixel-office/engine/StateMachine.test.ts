import { describe, it, expect } from "vitest";
import { StateMachine } from "./StateMachine";

describe("StateMachine", () => {
  describe("transition", () => {
    it("should transition from IDLE to WORK on COMMIT trigger", () => {
      const sm = new StateMachine("IDLE");
      const result = sm.transition("COMMIT");
      expect(result).toBe("WORK");
      expect(sm.current).toBe("WORK");
    });

    it("should transition from IDLE to REST on INACTIVE trigger", () => {
      const sm = new StateMachine("IDLE");
      const result = sm.transition("INACTIVE");
      expect(result).toBe("REST");
    });

    it("should transition from WORK to IDLE on COMPLETE trigger", () => {
      const sm = new StateMachine("WORK");
      const result = sm.transition("COMPLETE");
      expect(result).toBe("IDLE");
    });

    it("should transition from REST to IDLE on ACTIVATE trigger", () => {
      const sm = new StateMachine("REST");
      const result = sm.transition("ACTIVATE");
      expect(result).toBe("IDLE");
    });

    it("should return null for invalid transitions", () => {
      const sm = new StateMachine("REST");
      const result = sm.transition("COMMIT");
      expect(result).toBeNull();
      expect(sm.current).toBe("REST");
    });

    it("should return WALK when movement is needed", () => {
      const sm = new StateMachine("IDLE");
      const result = sm.transition("MOVE");
      expect(result).toBe("WALK");
    });

    it("should return to previous target state after WALK ARRIVE", () => {
      const sm = new StateMachine("WALK");
      const result = sm.transition("ARRIVE");
      expect(result).toBe("IDLE");
    });
  });

  describe("canTransition", () => {
    it("should return true for valid transitions", () => {
      const sm = new StateMachine("IDLE");
      expect(sm.canTransition("COMMIT")).toBe(true);
      expect(sm.canTransition("INACTIVE")).toBe(true);
      expect(sm.canTransition("MOVE")).toBe(true);
    });

    it("should return false for invalid transitions", () => {
      const sm = new StateMachine("REST");
      expect(sm.canTransition("COMMIT")).toBe(false);
      expect(sm.canTransition("COMPLETE")).toBe(false);
    });
  });

  describe("getAvailableTriggers", () => {
    it("should list all valid triggers for current state", () => {
      const sm = new StateMachine("IDLE");
      const triggers = sm.getAvailableTriggers();
      expect(triggers).toContain("COMMIT");
      expect(triggers).toContain("INACTIVE");
      expect(triggers).toContain("MOVE");
    });
  });
});
