import {
  Fragment,
  jsx as reactJsx,
  jsxs as reactJsxs,
  jsxDEV as reactJsxDEV,
} from "react/jsx-runtime";
import { cloneElement, isValidElement } from "react";
import { BizonText } from "./scope";

export { Fragment };
export type { JSX } from "react/jsx-runtime";

type JSXType = Parameters<typeof reactJsx>[0];
type JSXProps = Record<string, any> & { children?: unknown };

function mapVisibleChildren(children: unknown): unknown {
  if (typeof children === "string") {
    return reactJsx(BizonText, { value: children });
  }
  if (Array.isArray(children)) return children.map(mapVisibleChildren);
  return children;
}

function stripEmphasis(children: unknown): unknown {
  if (Array.isArray(children)) return children.map(stripEmphasis);
  if (!isValidElement(children)) return children;

  if (children.type === BizonText) {
    return (children.props as { value: string }).value;
  }

  const props = children.props as { children?: unknown };
  if (!("children" in props)) return children;
  return cloneElement(children, undefined, stripEmphasis(props.children));
}

function prepare(type: JSXType, props: JSXProps | null): JSXProps | null {
  if (!props) return props;

  if (typeof type !== "string") return props;

  const tag = type.toLowerCase();
  const suppressSubtree =
    ["b", "strong", "script", "style", "textarea", "template", "svg", "noscript"].includes(tag) ||
    props.hidden === true ||
    props["aria-hidden"] === true ||
    props["aria-hidden"] === "true" ||
    props.style?.display === "none" ||
    props.style?.visibility === "hidden" ||
    /(^|\s)(sr-only|screen-reader-only|visually-hidden|visuallyHidden)(\s|$)/i.test(String(props.className ?? ""));

  const children = mapVisibleChildren(props.children);
  if (suppressSubtree) {
    if (["script", "style", "textarea", "title", "template", "noscript"].includes(tag)) return props;
    return { ...props, children: stripEmphasis(children) };
  }

  if (tag === "footer" && "data-site-footer" in props) {
    return { ...props, children: stripEmphasis(children) };
  }

  return children === props.children ? props : { ...props, children };
}

export function jsx(type: JSXType, props: JSXProps | null, key?: string) {
  return reactJsx(type, prepare(type, props), key);
}

export function jsxs(type: JSXType, props: JSXProps | null, key?: string) {
  return reactJsxs(type, prepare(type, props), key);
}

export function jsxDEV(
  type: JSXType,
  props: JSXProps | null,
  key: string | undefined,
  isStaticChildren: boolean,
  source: Parameters<typeof reactJsxDEV>[4],
  self: Parameters<typeof reactJsxDEV>[5],
) {
  return reactJsxDEV(type, prepare(type, props), key, isStaticChildren, source, self);
}
