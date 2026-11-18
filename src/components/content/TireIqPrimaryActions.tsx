"use client";

import Link from "next/link";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/yandexMetrika";
import { TIRE_IQ_PRIMARY_ACTIONS } from "@/lib/content/tireIqJobs";

import styles from "./TireIqPrimaryActions.module.css";

export function TireIqPrimaryActions({ hasKnowledge = true }: { hasKnowledge?: boolean }) {
  return (
    <nav className={styles.actions} aria-label="Основные действия Tire IQ">
      {TIRE_IQ_PRIMARY_ACTIONS.map((action) => (
        <Link
          key={action.key}
          className="btn-accent"
          href={action.destination === "knowledge" && !hasKnowledge ? "/contact" : action.href}
          data-tire-iq-job={action.key}
          data-tire-iq-job-destination={action.destination}
          onClick={() => trackEvent(ANALYTICS_EVENTS.tireIqJobClick, {
            job_key: action.key,
            destination: action.destination,
          })}
        >
          {action.label}
        </Link>
      ))}
    </nav>
  );
}
