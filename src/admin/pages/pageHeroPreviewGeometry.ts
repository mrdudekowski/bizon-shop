import contract from "./pageHeroMediaContract.json";

const ROOT_FONT_SIZE_PX = 16;

function clamp(min: number, value: number, max: number): number {
  return Math.min(Math.max(min, value), max);
}

export function pageHeroReferenceViewport(
  viewport: "desktop" | "tablet" | "mobile",
): { width: number; height: number } {
  return { ...contract.referenceViewports[viewport] };
}

export function pageHeroPreviewGeometry({
  pageKey,
  viewportWidth,
  viewportHeight,
  pageContainerWidth = viewportWidth,
}: {
  pageKey: string;
  viewportWidth: number;
  viewportHeight: number;
  /** Width available to the public hero before its max-width and gutters. */
  pageContainerWidth?: number;
}): { layout: "banner" | "aside"; width: number; height: number } {
  const { bannerPageKeys, breakpoints, banner, aside } = contract;

  if (bannerPageKeys.includes(pageKey)) {
    const height = Math.min(banner.heightVh, banner.maxHeightSvh) * viewportHeight / 100;
    return {
      layout: "banner",
      width: viewportWidth,
      height: Math.max(banner.minHeightRem * ROOT_FONT_SIZE_PX, height),
    };
  }

  const isMobile = viewportWidth <= breakpoints.mobileMaxWidthPx;
  const isSingleColumn = viewportWidth <= breakpoints.asideSingleColumnMaxWidthPx;
  const gutter = viewportWidth >= breakpoints.desktopMinWidthPx
    ? aside.pageGutterPx.desktop
    : viewportWidth >= breakpoints.tabletMinWidthPx
      ? aside.pageGutterPx.tablet
      : aside.pageGutterPx.mobile;
  const { containerWidth, columnGap } = aside;
  const maxWidth = clamp(containerWidth.minPx, containerWidth.widthVw * viewportWidth / 100, containerWidth.maxPx);
  const trackWidth = (isSingleColumn ? pageContainerWidth : Math.min(pageContainerWidth, maxWidth)) - 2 * gutter;
  const gap = clamp(
    columnGap.minRem * ROOT_FONT_SIZE_PX,
    columnGap.widthVw * viewportWidth / 100,
    columnGap.maxRem * ROOT_FONT_SIZE_PX,
  );
  const width = isSingleColumn ? trackWidth : (trackWidth - gap) * aside.desktopColumnFraction;
  const height = isMobile
    ? aside.mobileHeightVw * viewportWidth / 100
    : clamp(aside.minHeightRem * ROOT_FONT_SIZE_PX, aside.heightVw * viewportWidth / 100, aside.maxHeightRem * ROOT_FONT_SIZE_PX);

  return { layout: "aside", width: Math.max(0, width), height };
}
