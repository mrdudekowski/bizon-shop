"use client";

import { ChevronIcon, Gutter, Link, useConfig } from "@payloadcms/ui";
import { useCallback, useState } from "react";
import { formatAdminURL } from "payload/shared";

import {
  catalogDashboardSections,
  type CatalogDashboardAction,
  type CatalogDashboardSection,
} from "@/lib/catalog/catalogNav";

import "./CatalogDashboard.scss";

type ExpandedSectionId = CatalogDashboardSection["id"] | null;

function collectionHref(adminRoute: string, action: Pick<CatalogDashboardAction, "collection" | "create">) {
  const suffix = action.create ? "/create" : "";
  return formatAdminURL({
    adminRoute,
    path: `/collections/${action.collection}${suffix}` as `/${string}`,
    relative: true,
  });
}

export function CatalogDashboard() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const [expandedSectionId, setExpandedSectionId] = useState<ExpandedSectionId>(null);

  const toggleSection = useCallback((sectionId: CatalogDashboardSection["id"]) => {
    setExpandedSectionId((current) => (current === sectionId ? null : sectionId));
  }, []);

  return (
    <Gutter className="dashboard catalog-dashboard">
      <h1 className="catalog-dashboard__title">Что вы хотите редактировать?</h1>

      <div className="catalog-dashboard__sections">
        {catalogDashboardSections.map((section) => {
          const isExpanded = expandedSectionId === section.id;

          return (
            <article
              key={section.id}
              className={`catalog-dashboard__section${isExpanded ? " is-expanded" : ""}`}
            >
              <button
                type="button"
                className="catalog-dashboard__section-toggle"
                aria-expanded={isExpanded}
                aria-controls={`catalog-dashboard-actions-${section.id}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className="catalog-dashboard__section-heading">
                  <h2 className="catalog-dashboard__section-title">{section.title}</h2>
                  <p className="catalog-dashboard__section-description">{section.description}</p>
                </span>
                <ChevronIcon
                  aria-hidden
                  className={`catalog-dashboard__section-chevron${isExpanded ? " is-expanded" : ""}`}
                  direction="down"
                />
              </button>

              {isExpanded ? (
                <div
                  id={`catalog-dashboard-actions-${section.id}`}
                  className="catalog-dashboard__actions"
                >
                  {section.items.map((item) => (
                    <Link
                      key={`${section.id}-${item.label}`}
                      className="catalog-dashboard__action-card"
                      href={collectionHref(adminRoute, item)}
                    >
                      <span className="catalog-dashboard__action-label">{item.label}</span>
                      <ChevronIcon
                        aria-hidden
                        className="catalog-dashboard__action-chevron"
                        direction="right"
                      />
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </Gutter>
  );
}
