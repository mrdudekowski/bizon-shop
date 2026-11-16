import {
  Fragment,
  jsx as reactJsx,
  jsxs as reactJsxs,
} from "react/jsx-runtime";
import { jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
import { cloneElement, isValidElement, type CSSProperties, type ReactNode } from "react";
import { BizonText, findBizonTextTokens } from "./scope";

export { Fragment };
export type { JSX } from "react/jsx-runtime";

type JSXType = Parameters<typeof reactJsx>[0];
type JSXProps = Record<string, unknown> & {
  children?: ReactNode;
  className?: string;
  hidden?: boolean;
  style?: CSSProperties;
};

function mapVisibleChildren(children: ReactNode, key = "bizon-text"): ReactNode {
  if (typeof children === "string") {
    return reactJsx(BizonText, { value: children }, key);
  }
  if (Array.isArray(children)) return children.map((child, index) => mapVisibleChildren(child, `${key}-${index}`));
  return children;
}

function emphasizeExistingStrongText(value: string, keyPrefix: string): ReactNode {
  const output: ReactNode[] = [];
  let previousIndex = 0;

  for (const match of findBizonTextTokens(value)) {
    const index = match.index;
    if (index > previousIndex) output.push(value.slice(previousIndex, index));
    output.push(reactJsx("span", { className: "bizon-word-emphasis", children: match.text.toUpperCase() }, `${keyPrefix}-${index}`));
    previousIndex = index + match.text.length;
  }

  if (previousIndex === 0) return value;
  if (previousIndex < value.length) output.push(value.slice(previousIndex));
  return output;
}

function stripEmphasis(children: ReactNode, keyPrefix = "bizon-strong"): ReactNode {
  if (Array.isArray(children)) return children.map((child, index) => stripEmphasis(child, `${keyPrefix}-${index}`));
  if (!isValidElement(children)) return children;

  if (children.type === BizonText) {
    return emphasizeExistingStrongText((children.props as { value: string }).value, keyPrefix);
  }

  const props = children.props as { children?: ReactNode };
  if (!("children" in props)) return children;
  return cloneElement(children, undefined, stripEmphasis(props.children, keyPrefix));
}

function isSuppressedByProps(props: JSXProps) {
  return (
    props.hidden === true ||
    props["aria-hidden"] === true ||
    props["aria-hidden"] === "true" ||
    props.style?.display === "none" ||
    props.style?.visibility === "hidden" ||
    /(^|\s)(sr-only|screen-reader-only|visually-hidden|visuallyHidden)(\s|$)/i.test(String(props.className ?? ""))
  );
}

function prepare(type: JSXType, props: JSXProps | null): JSXProps | null {
  if (!props) return props;

  if (typeof type !== "string") {
    if (isSuppressedByProps(props)) return props;
    const children = mapVisibleChildren(props.children);
    return children === props.children ? props : { ...props, children };
  }

  const tag = type.toLowerCase();
  const suppressSubtree =
    ["b", "strong", "script", "style", "textarea", "template", "svg", "noscript"].includes(tag) ||
    isSuppressedByProps(props);

  const children = mapVisibleChildren(props.children);
  if (suppressSubtree) {
    if (["script", "style", "textarea", "title", "template", "noscript"].includes(tag)) return props;
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
