"use client";

import {
  FieldLabel,
  PillSelector,
  RelationshipInput,
  useConfig,
  useField,
  usePayloadAPI,
} from "@payloadcms/ui";
import type { RelationshipFieldClientComponent, ValueWithRelation, Where } from "payload";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildTargetWhere,
  CATALOG_AXES,
  extractFiltersFromDoc,
  getAxisById,
  getAxisByRelationTo,
  hasRelatedProduct,
  parseStoredRelation,
  type CatalogAxisId,
  type CatalogFilterStep,
} from "./relatedCatalogFieldConfig";

import "./RelatedCatalogField.scss";

type PillOption = { key: string; name: string };

function visiblePills(selected: string | null, options: PillOption[]) {
  if (!selected) {
    return options.map((option) => ({ ...option, selected: false }));
  }

  const match = options.find((option) => option.key === selected);
  return [{ key: selected, name: match?.name ?? selected, selected: true }];
}

function FilterPills({
  label,
  options,
  selected,
  isLoading,
  onChange,
}: {
  label: string;
  options: PillOption[];
  selected: string | null;
  isLoading?: boolean;
  onChange: (value: string | null) => void;
}) {
  const pills = visiblePills(selected, options);

  return (
    <div className="related-catalog-field__group">
      <p className="related-catalog-field__group-label">{label}</p>
      {isLoading ? <p className="related-catalog-field__loading">Загрузка…</p> : null}
      <PillSelector
        onClick={({ pill }) => {
          if (pill.selected) {
            onChange(null);
            return;
          }
          onChange(pill.key ?? pill.name);
        }}
        pills={pills}
      />
    </div>
  );
}

function CollectionStepPills({
  step,
  filters,
  onChange,
}: {
  filters: Record<string, string | null>;
  onChange: (stepId: string, value: string | null) => void;
  step: Extract<CatalogFilterStep, { type: "collection" }>;
}) {
  const {
    config: { routes, serverURL },
  } = useConfig();
  const selected = filters[step.id] ?? null;
  const apiUrl = `${serverURL || ""}${routes.api}/${step.collection}`;
  const [{ data, isLoading }] = usePayloadAPI(apiUrl, {
    initialParams: { depth: 0, limit: 100, sort: "name" },
  });

  const options = useMemo<PillOption[]>(() => {
    const docs = (data?.docs ?? []) as Array<{ id: number | string; name?: string }>;
    return docs.map((doc) => ({
      key: String(doc.id),
      name: doc.name || String(doc.id),
    }));
  }, [data?.docs]);

  return (
    <FilterPills
      isLoading={isLoading}
      label={step.label}
      onChange={(value) => onChange(step.id, value)}
      options={options}
      selected={selected}
    />
  );
}

function SelectStepPills({
  step,
  filters,
  onChange,
}: {
  filters: Record<string, string | null>;
  onChange: (stepId: string, value: string | null) => void;
  step: Extract<CatalogFilterStep, { type: "select" }>;
}) {
  const selected = filters[step.id] ?? null;
  const options = step.options.map((option) => ({ key: option.value, name: option.label }));

  return (
    <FilterPills
      label={step.label}
      onChange={(value) => onChange(step.id, value)}
      options={options}
      selected={selected}
    />
  );
}

function StepFilterPills({
  step,
  filters,
  onChange,
}: {
  filters: Record<string, string | null>;
  onChange: (stepId: string, value: string | null) => void;
  step: CatalogFilterStep;
}) {
  return step.type === "collection" ? (
    <CollectionStepPills filters={filters} onChange={onChange} step={step} />
  ) : (
    <SelectStepPills filters={filters} onChange={onChange} step={step} />
  );
}

export const RelatedCatalogField: RelationshipFieldClientComponent = ({
  field,
  path: pathFromProps,
  readOnly,
}) => {
  const {
    customComponents: { Description, Error, Label } = {},
    path,
    setValue,
    showError,
    value,
  } = useField<ValueWithRelation | null>({ path: pathFromProps });
  const [axisId, setAxisId] = useState<CatalogAxisId | null>(null);
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const hydratedRef = useRef(false);

  const axis = getAxisById(axisId);

  useEffect(() => {
    if (hydratedRef.current || !value) return;

    const parsed = parseStoredRelation(value);
    if (!parsed) return;

    const nextAxis = getAxisByRelationTo(parsed.relationTo);
    if (!nextAxis) return;

    setAxisId(nextAxis.id);
    if (parsed.doc) {
      setFilters(extractFiltersFromDoc(nextAxis, parsed.doc));
    }

    hydratedRef.current = true;
  }, [value]);

  const axisPills = useMemo(() => {
    const options = CATALOG_AXES.map((item) => ({ key: item.id, name: item.label }));
    return visiblePills(axisId, options);
  }, [axisId]);

  const targetWhere = useMemo(
    () => (axis ? buildTargetWhere(axis, filters) : true),
    [axis, filters],
  );

  const filterOptions = useMemo(
    () => (axis ? { [axis.relationTo]: targetWhere as Where | true } : undefined),
    [axis, targetWhere],
  );

  const handleAxisClick = useCallback(
    (nextAxisId: CatalogAxisId | null) => {
      setAxisId(nextAxisId);
      setFilters({});
      if (hasRelatedProduct(value)) {
        setValue(null);
      }
    },
    [setValue, value],
  );

  const handleFilterChange = useCallback(
    (stepId: string, nextValue: string | null) => {
      setFilters((current) => ({ ...current, [stepId]: nextValue }));
      if (hasRelatedProduct(value)) {
        setValue(null);
      }
    },
    [setValue, value],
  );

  const relationshipValue = useMemo(() => {
    if (!value || !axis) return null;

    if (typeof value === "object" && "relationTo" in value && "value" in value) {
      return value.relationTo === axis.relationTo ? value : null;
    }

    return null;
  }, [axis, value]);

  return (
    <div className="related-catalog-field">
      {Label ?? <FieldLabel label={field.label} path={path} required={field.required} />}
      {Description}

      <div className="related-catalog-field__group">
        <p className="related-catalog-field__group-label">Направление каталога</p>
        <PillSelector
          onClick={({ pill }) => {
            if (pill.selected) {
              handleAxisClick(null);
              return;
            }
            handleAxisClick(pill.key as CatalogAxisId);
          }}
          pills={axisPills}
        />
      </div>

      {axis ? (
        <>
          <div className="related-catalog-field__filters">
            {axis.steps.map((step) => (
              <StepFilterPills
                key={step.id}
                filters={filters}
                onChange={handleFilterChange}
                step={step}
              />
            ))}
          </div>

          <div className="related-catalog-field__target">
            <RelationshipInput
              allowCreate={false}
              appearance="select"
              filterOptions={filterOptions}
              hasMany={false}
              label={axis.targetLabel}
              onChange={(nextValue) => {
                if (!nextValue) {
                  if (hasRelatedProduct(value)) {
                    setValue(null);
                  }
                  return;
                }

                setValue({
                  relationTo: axis.relationTo,
                  value: nextValue.value,
                });
              }}
              path={path}
              readOnly={readOnly}
              relationTo={[axis.relationTo]}
              required={field.required}
              showError={showError}
              value={relationshipValue}
            />
          </div>
        </>
      ) : null}

      {Error}
    </div>
  );
};
