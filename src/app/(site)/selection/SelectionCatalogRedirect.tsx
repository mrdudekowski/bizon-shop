"use client";

import { useEffect } from "react";

import { ROUTES } from "@/constants/navigation";

export function SelectionCatalogRedirect() {
  useEffect(() => {
    window.location.replace(ROUTES.models);
  }, []);

  return null;
}
