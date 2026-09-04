import { describe, expect, it } from "vitest";

import type { SessionRow, TrendPoint } from "../data/demo";
import {
  calculateActiveDays,
  calculateAverageAccuracy,
  calculateAverageReaction,
  calculateCompletionRate,
  computeProgressMetrics,
  deduplicateSessions,
  groupSessionsByGame,
  sortSessionsNewestFirst,
  sortTrendsChronologically,
} from "./progressAnalytics";

describe("progressAnalytics", () => {
  describe("deduplicateSessions", () => {
    it("removes duplicate sessions with matching ids", () => {
      const input: SessionRow[] = [
        {
          id: "s1",
          game: "Sequencing",
          playedAt: "Fri, 4 Sep, 7:41 pm",
          playedAtIso: "2026-09-04T14:11:00.000Z",
          accuracy: 80,
          reactionMs: 900,
          completed: true,
        },
        {
          id: "s1", // duplicate from offline sync
          game: "Sequencing",
          playedAt: "Fri, 4 Sep, 7:41 pm",
          playedAtIso: "2026-09-04T14:11:00.000Z",
          accuracy: 80,
          reactionMs: 900,
          completed: true,
        },
        {
          id: "s2",
          game: "Memory Match",
          playedAt: "Fri, 4 Sep, 7:20 pm",
          playedAtIso: "2026-09-04T13:50:00.000Z",
          accuracy: 100,
          reactionMs: 850,
          completed: true,
        },
      ];

      const deduped = deduplicateSessions(input);
      expect(deduped).toHaveLength(2);
      expect(deduped.map((s) => s.id)).toEqual(["s1", "s2"]);
    });

    it("handles empty session list without errors", () => {
      expect(deduplicateSessions([])).toEqual([]);
    });
  });

  describe("sortSessionsNewestFirst", () => {
    it("sorts sessions by playedAtIso descending (newest first)", () => {
      const input: SessionRow[] = [
        {
          id: "s1",
          game: "Old Game",
          playedAt: "Fri, 4 Sep, 5:00 pm",
          playedAtIso: "2026-09-04T11:30:00.000Z",
          accuracy: 80,
          reactionMs: 900,
          completed: true,
        },
        {
          id: "s2",
          game: "Newest Game",
          playedAt: "Fri, 4 Sep, 7:41 pm",
          playedAtIso: "2026-09-04T14:11:00.000Z",
          accuracy: 90,
          reactionMs: 800,
          completed: true,
        },
        {
          id: "s3",
          game: "Middle Game",
          playedAt: "Fri, 4 Sep, 6:00 pm",
          playedAtIso: "2026-09-04T12:30:00.000Z",
          accuracy: 70,
          reactionMs: 950,
          completed: false,
        },
      ];

      const sorted = sortSessionsNewestFirst(input);
      expect(sorted.map((s) => s.id)).toEqual(["s2", "s3", "s1"]);
    });
  });

  describe("sortTrendsChronologically", () => {
    it("sorts ISO trend points chronologically (oldest to newest for left-to-right charts)", () => {
      const trends: TrendPoint[] = [
        { day: "2026-09-04", accuracy: 85, reactionMs: 900 },
        { day: "2026-09-01", accuracy: 70, reactionMs: 1100 },
        { day: "2026-09-03", accuracy: 80, reactionMs: 950 },
        { day: "2026-09-02", accuracy: 75, reactionMs: 1000 },
      ];

      const sorted = sortTrendsChronologically(trends);
      expect(sorted.map((t) => t.day)).toEqual([
        "2026-09-01",
        "2026-09-02",
        "2026-09-03",
        "2026-09-04",
      ]);
    });

    it("sorts weekday trend points chronologically instead of alphabetically", () => {
      const trends: TrendPoint[] = [
        { day: "Fri", accuracy: 68, reactionMs: 1080 },
        { day: "Mon", accuracy: 70, reactionMs: 1040 },
        { day: "Sat", accuracy: 70, reactionMs: 1120 },
        { day: "Sun", accuracy: 78, reactionMs: 975 },
        { day: "Thu", accuracy: 74, reactionMs: 990 },
        { day: "Tue", accuracy: 72, reactionMs: 1010 },
        { day: "Wed", accuracy: 69, reactionMs: 1100 },
      ];

      const sorted = sortTrendsChronologically(trends);
      // Must NOT be alphabetical: Fri → Mon → Sat → Sun → Thu → Tue → Wed
      // Must BE chronological: Mon → Tue → Wed → Thu → Fri → Sat → Sun
      expect(sorted.map((t) => t.day)).toEqual([
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ]);
    });
  });

  describe("calculateCompletionRate", () => {
    it("calculates accurate completion percentage", () => {
      expect(calculateCompletionRate(4, 5)).toBe(80);
      expect(calculateCompletionRate(5, 5)).toBe(100);
      expect(calculateCompletionRate(0, 5)).toBe(0);
    });

    it("returns null when total is zero (avoids division by zero / NaN)", () => {
      expect(calculateCompletionRate(0, 0)).toBeNull();
    });
  });

  describe("calculateAverageAccuracy", () => {
    it("averages numeric accuracy values", () => {
      const sessions = [{ accuracy: 80 }, { accuracy: 90 }, { accuracy: 100 }];
      expect(calculateAverageAccuracy(sessions)).toBe(90);
    });

    it("excludes missing or null accuracy values without treating them as 0%", () => {
      const sessions = [
        { accuracy: 80 },
        { accuracy: null },
        { accuracy: undefined },
        { accuracy: 100 },
      ];
      expect(calculateAverageAccuracy(sessions)).toBe(90);
    });

    it("returns null when no valid accuracy values exist", () => {
      expect(calculateAverageAccuracy([])).toBeNull();
      expect(
        calculateAverageAccuracy([{ accuracy: null }, { accuracy: undefined }]),
      ).toBeNull();
    });
  });

  describe("calculateAverageReaction", () => {
    it("calculates average reaction time in ms", () => {
      const sessions = [
        { reactionMs: 800 },
        { reactionMs: 1000 },
        { reactionMs: 900 },
      ];
      expect(calculateAverageReaction(sessions)).toBe(900);
    });

    it("returns null for empty session list", () => {
      expect(calculateAverageReaction([])).toBeNull();
    });
  });

  describe("calculateActiveDays", () => {
    it("counts unique active days", () => {
      const sessions: SessionRow[] = [
        {
          id: "1",
          game: "G1",
          playedAt: "Fri, 4 Sep",
          playedAtIso: "2026-09-04T10:00:00Z",
          accuracy: 80,
          reactionMs: 900,
          completed: true,
        },
        {
          id: "2",
          game: "G2",
          playedAt: "Fri, 4 Sep",
          playedAtIso: "2026-09-04T14:00:00Z",
          accuracy: 90,
          reactionMs: 800,
          completed: true,
        },
        {
          id: "3",
          game: "G3",
          playedAt: "Thu, 3 Sep",
          playedAtIso: "2026-09-03T09:00:00Z",
          accuracy: 70,
          reactionMs: 950,
          completed: true,
        },
      ];

      expect(calculateActiveDays(sessions)).toBe(2);
    });
  });

  describe("groupSessionsByGame", () => {
    it("groups sessions by canonical game name and computes game stats", () => {
      const sessions: SessionRow[] = [
        {
          id: "1",
          game: "Sequencing",
          playedAt: "Fri, 4 Sep",
          playedAtIso: "2026-09-04T14:00:00Z",
          accuracy: 80,
          reactionMs: 900,
          completed: true,
        },
        {
          id: "2",
          game: "Sequencing",
          playedAt: "Fri, 4 Sep",
          playedAtIso: "2026-09-04T15:00:00Z",
          accuracy: 100,
          reactionMs: 800,
          completed: false,
        },
        {
          id: "3",
          game: "Memory Match",
          playedAt: "Fri, 4 Sep",
          playedAtIso: "2026-09-04T12:00:00Z",
          accuracy: 90,
          reactionMs: 850,
          completed: true,
        },
      ];

      const grouped = groupSessionsByGame(sessions);
      expect(grouped).toHaveLength(2);

      const seq = grouped.find((g) => g.game === "Sequencing");
      expect(seq).toBeDefined();
      expect(seq?.totalSessions).toBe(2);
      expect(seq?.completedSessions).toBe(1);
      expect(seq?.completionRate).toBe(50);
      expect(seq?.avgAccuracy).toBe(90);

      const mem = grouped.find((g) => g.game === "Memory Match");
      expect(mem).toBeDefined();
      expect(mem?.totalSessions).toBe(1);
      expect(mem?.completedSessions).toBe(1);
      expect(mem?.completionRate).toBe(100);
      expect(mem?.avgAccuracy).toBe(90);
    });
  });

  describe("computeProgressMetrics", () => {
    it("computes full consistent metrics bundle without demo substitutions", () => {
      const sessions: SessionRow[] = [
        {
          id: "1",
          game: "Attention Garden",
          playedAt: "Fri, 4 Sep",
          playedAtIso: "2026-09-04T10:00:00Z",
          accuracy: 90,
          reactionMs: 850,
          completed: true,
        },
        {
          id: "2",
          game: "Sequencing",
          playedAt: "Fri, 4 Sep",
          playedAtIso: "2026-09-04T11:00:00Z",
          accuracy: 70,
          reactionMs: 950,
          completed: false,
        },
      ];

      const metrics = computeProgressMetrics(sessions);
      expect(metrics.totalSessions).toBe(2);
      expect(metrics.completedSessions).toBe(1);
      expect(metrics.completionRate).toBe(50);
      expect(metrics.avgAccuracy).toBe(80);
      expect(metrics.avgReactionMs).toBe(900);
      expect(metrics.activeDaysCount).toBe(1);
      expect(metrics.gameStats).toHaveLength(2);
    });

    it("handles zero sessions gracefully without NaN", () => {
      const metrics = computeProgressMetrics([]);
      expect(metrics.totalSessions).toBe(0);
      expect(metrics.completedSessions).toBe(0);
      expect(metrics.completionRate).toBeNull();
      expect(metrics.avgAccuracy).toBeNull();
      expect(metrics.avgReactionMs).toBeNull();
      expect(metrics.activeDaysCount).toBe(0);
      expect(metrics.gameStats).toEqual([]);
    });
  });
});
