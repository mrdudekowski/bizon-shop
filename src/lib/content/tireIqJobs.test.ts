import { describe, expect, it } from "vitest";

import { TIRE_IQ_JOBS } from "./tireIqJobs";

describe("Tire IQ jobs", () => {
  it("contains five unique jobs with honest destinations", () => {
    expect(TIRE_IQ_JOBS).toHaveLength(5);
    expect(new Set(TIRE_IQ_JOBS.map((job) => job.key)).size).toBe(5);
    expect(TIRE_IQ_JOBS.map((job) => job.key)).toEqual([
      "selection",
      "understanding",
      "validation",
      "operation",
      "diagnosis",
    ]);
    expect(TIRE_IQ_JOBS.every((job) => job.href.startsWith("/"))).toBe(true);
  });
});
