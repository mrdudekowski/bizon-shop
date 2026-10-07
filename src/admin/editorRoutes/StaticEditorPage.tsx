import { Suspense } from "react";

import { EditorRoute, type EditorRouteKind } from "./EditorRoute";

export function StaticEditorPage({ kind }: { kind: EditorRouteKind }) {
  return <Suspense fallback={<p>Загрузка редактора…</p>}><EditorRoute kind={kind} /></Suspense>;
}
