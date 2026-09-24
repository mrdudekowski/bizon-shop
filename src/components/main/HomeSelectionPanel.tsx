"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { FitmentStep } from "@/components/selection/FitmentStep";
import { OperatingConditionsStep } from "@/components/selection/OperatingConditionsStep";
import selectionStyles from "@/components/selection/Selection.module.css";
import { SelectionProgress } from "@/components/selection/SelectionProgress";
import { SelectionResult } from "@/components/selection/SelectionResult";
import { VehicleTypeStep } from "@/components/selection/VehicleTypeStep";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { PageShell } from "@/lib/content/pages/types";
import { recommendTires } from "@/lib/selection/engine";
import { selectionHomeHref } from "@/lib/selection/homeHref";
import type { SelectionState, SelectionStep } from "@/lib/selection/types";
import {
  getFirstMissingStep,
  parseSelectionParams,
} from "@/lib/selection/urlState";

import styles from "./MainHome.module.css";

const STEP_ORDER: SelectionStep[] = [
  "vehicle",
  "conditions",
  "fitment",
  "result",
];

function resolveStep(
  params: URLSearchParams,
  state: SelectionState,
): SelectionStep {
  const missingStep = getFirstMissingStep(state);
  const requestedStep = params.get("step") as SelectionStep | null;

  if (!requestedStep || !STEP_ORDER.includes(requestedStep)) return missingStep;
  if (STEP_ORDER.indexOf(requestedStep) > STEP_ORDER.indexOf(missingStep)) {
    return missingStep;
  }
  return requestedStep;
}

function previousStep(step: SelectionStep): SelectionStep | null {
  const currentIndex = STEP_ORDER.indexOf(step);
  return currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null;
}

export function HomeSelectionPanel({
  catalog,
  content,
}: {
  catalog: TireCatalogReadModel;
  content: PageShell;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsedState = useMemo(
    () => parseSelectionParams(searchParams),
    [searchParams],
  );
  const activeStep = resolveStep(
    new URLSearchParams(searchParams.toString()),
    parsedState,
  );
  const [draft, setDraft] = useState<SelectionState>(parsedState);
  const questionRef = useRef<HTMLLegendElement>(null);

  useEffect(() => {
    setDraft(parsedState);
  }, [parsedState, searchParams]);

  useEffect(() => {
    if (activeStep !== "vehicle") questionRef.current?.focus();
  }, [activeStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      !window.location.hash.includes("solutions") &&
      !window.location.search
    ) {
      return;
    }
    document.getElementById("solutions")?.scrollIntoView({ block: "start" });
  }, []);

  const syncDraft = (
    nextState: SelectionState,
    step: SelectionStep = activeStep,
  ) => {
    setDraft(nextState);
    router.replace(selectionHomeHref(nextState, step), { scroll: false });
  };

  const advance = (nextState: SelectionState, nextStep: SelectionStep) => {
    setDraft(nextState);
    router.push(selectionHomeHref(nextState, nextStep), { scroll: false });
  };

  const returnToPreviousStep = () => {
    const targetStep = previousStep(activeStep);
    if (targetStep) advance(draft, targetStep);
  };

  const canContinue =
    (activeStep === "vehicle" && Boolean(draft.vehicle)) ||
    (activeStep === "conditions" && draft.conditions.length > 0) ||
    (activeStep === "fitment" &&
      Boolean(draft.axle) &&
      typeof draft.sizeKnown === "boolean" &&
      (!draft.sizeKnown || Boolean(draft.size?.trim())));

  const result =
    activeStep === "result" ? recommendTires(catalog, draft) : null;
  const nextStep: SelectionStep =
    activeStep === "vehicle"
      ? "conditions"
      : activeStep === "conditions"
        ? "fitment"
        : "result";

  return (
    <section
      className={styles.selectionEntry}
      id="solutions"
      data-main-chrome-tone="light"
    >
      <div className={styles.inner}>
        <header className={styles.sectionHeading}>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h2>{content.title}</h2>
          <p>{content.lead}</p>
          <p>
            Уже знаете размер и количество?{" "}
            <Link href="/contact?subject=procurement">Отправьте спецификацию</Link> — проверим подходящие модели и сформируем запрос.
          </p>
        </header>

        <div className={styles.selectionPanel}>
          {catalog.directions.length === 0 ? (
            <div className={selectionStyles.failure}>
              <p className={selectionStyles.eyebrow}>Каталог проверяется</p>
              <h2>Уточним решение вручную</h2>
              <p>
                В опубликованном каталоге пока нет готовых направлений. Мы не
                будем показывать вымышленные модели.
              </p>
              <Link
                className="btn-accent"
                href="/contact?subject=tire-selection"
              >
                Запросить консультацию
              </Link>
            </div>
          ) : activeStep === "result" && result ? (
            <div className={selectionStyles.wizard}>
              <SelectionResult
                result={result}
                catalog={catalog}
                state={draft}
              />
              <button
                className={selectionStyles.backButton}
                type="button"
                onClick={returnToPreviousStep}
              >
                ← Назад к параметрам
              </button>
            </div>
          ) : (
            <div className={selectionStyles.wizard}>
              <SelectionProgress step={activeStep} />
              {activeStep === "vehicle" ? (
                <VehicleTypeStep
                  value={draft.vehicle}
                  onChange={(vehicle) =>
                    syncDraft({ conditions: [], vehicle })
                  }
                />
              ) : null}
              {activeStep === "conditions" ? (
                <OperatingConditionsStep
                  ref={questionRef}
                  values={draft.conditions}
                  onChange={(conditions) =>
                    syncDraft({ ...draft, conditions })
                  }
                />
              ) : null}
              {activeStep === "fitment" ? (
                <FitmentStep
                  ref={questionRef}
                  state={draft}
                  onChange={syncDraft}
                />
              ) : null}
              <div className={selectionStyles.wizardActions}>
                {activeStep !== "vehicle" ? (
                  <button
                    className={selectionStyles.backButton}
                    type="button"
                    onClick={returnToPreviousStep}
                  >
                    Назад
                  </button>
                ) : null}
                <button
                  className="btn-accent"
                  type="button"
                  disabled={!canContinue}
                  onClick={() => advance(draft, nextStep)}
                >
                  Продолжить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
