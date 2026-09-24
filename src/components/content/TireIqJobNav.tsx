"use client";

import Link from "next/link";

import type { TireIqJob } from "@/lib/content/tireIqJobs";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/yandexMetrika";

import styles from "./TireIqJobNav.module.css";

type TireIqJobNavProps = {
  jobs: readonly TireIqJob[];
  hasKnowledge?: boolean;
};

export function TireIqJobNav({ jobs, hasKnowledge = true }: TireIqJobNavProps) {
  return (
    <nav className={styles.nav} aria-label="Задачи Tire IQ">
      <p className={styles.label}>Что нужно сделать</p>
      <ol className={styles.list}>
        {jobs.map((job, index) => (
          <li key={job.key} className={styles.item}>
            <Link
              className={styles.link}
              href={job.destination === "knowledge" && !hasKnowledge ? "/contact" : job.href}
              data-tire-iq-job={job.key}
              data-tire-iq-job-destination={job.destination}
              onClick={() =>
                trackEvent(ANALYTICS_EVENTS.tireIqJobClick, {
                  job_key: job.key,
                  destination: job.destination,
                })
              }
            >
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.copy}>
                <span className={styles.title}>{job.label}</span>
                <span className={styles.outcome}>{job.outcome}</span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
