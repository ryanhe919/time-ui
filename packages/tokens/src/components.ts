/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 components 设计令牌。
 */

export const buttonSizes = {
  xs: {
    height: '28px',
    minWidth: '56px',
    fontSize: '11px',
    lineHeight: '14px',
    paddingX: '10px',
    gap: '6px',
    radius: '6px',
  },
  sm: {
    height: '32px',
    minWidth: '64px',
    fontSize: '12px',
    lineHeight: '16px',
    paddingX: '12px',
    gap: '8px',
    radius: '8px',
  },
  md: {
    height: '40px',
    minWidth: '80px',
    fontSize: '14px',
    lineHeight: '20px',
    paddingX: '16px',
    gap: '8px',
    radius: '12px',
  },
  lg: {
    height: '48px',
    minWidth: '96px',
    fontSize: '16px',
    lineHeight: '24px',
    paddingX: '24px',
    gap: '12px',
    radius: '14px',
  },
  xl: {
    height: '56px',
    minWidth: '112px',
    fontSize: '18px',
    lineHeight: '28px',
    paddingX: '28px',
    gap: '12px',
    radius: '16px',
  },
} as const;

export const inputSizes = {
  xs: {
    height: '28px',
    fontSize: '12px',
    lineHeight: '16px',
    paddingX: '10px',
    iconSize: '14px',
    gap: '6px',
  },
  sm: {
    height: '32px',
    fontSize: '13px',
    lineHeight: '18px',
    paddingX: '12px',
    iconSize: '14px',
    gap: '8px',
  },
  md: {
    height: '40px',
    fontSize: '14px',
    lineHeight: '20px',
    paddingX: '14px',
    iconSize: '16px',
    gap: '8px',
  },
  lg: {
    height: '48px',
    fontSize: '16px',
    lineHeight: '24px',
    paddingX: '16px',
    iconSize: '18px',
    gap: '10px',
  },
  xl: {
    height: '56px',
    fontSize: '18px',
    lineHeight: '28px',
    paddingX: '20px',
    iconSize: '20px',
    gap: '12px',
  },
} as const;

export const checkboxSizes = {
  xs: {
    indicator: '12px',
    fontSize: '11px',
    gap: '6px',
  },
  sm: {
    indicator: '16px',
    fontSize: '13px',
    gap: '8px',
  },
  md: {
    indicator: '20px',
    fontSize: '14px',
    gap: '8px',
  },
  lg: {
    indicator: '24px',
    fontSize: '16px',
    gap: '8px',
  },
  xl: {
    indicator: '28px',
    fontSize: '18px',
    gap: '10px',
  },
} as const;

export const switchSizes = {
  xs: {
    trackWidth: '24px',
    trackHeight: '14px',
    thumbSize: '10px',
    padding: '2px',
  },
  sm: {
    trackWidth: '32px',
    trackHeight: '20px',
    thumbSize: '16px',
    padding: '2px',
  },
  md: {
    trackWidth: '48px',
    trackHeight: '28px',
    thumbSize: '24px',
    padding: '2px',
  },
  lg: {
    trackWidth: '56px',
    trackHeight: '32px',
    thumbSize: '28px',
    padding: '2px',
  },
  xl: {
    trackWidth: '72px',
    trackHeight: '40px',
    thumbSize: '36px',
    padding: '2px',
  },
} as const;

export const sliderSizes = {
  xs: {
    trackThickness: '4px',
    thumbSize: '12px',
    fontSize: '11px',
    labelGap: '6px',
    verticalLength: '120px',
  },
  sm: {
    trackThickness: '6px',
    thumbSize: '16px',
    fontSize: '12px',
    labelGap: '8px',
    verticalLength: '160px',
  },
  md: {
    trackThickness: '8px',
    thumbSize: '20px',
    fontSize: '14px',
    labelGap: '10px',
    verticalLength: '200px',
  },
  lg: {
    trackThickness: '10px',
    thumbSize: '24px',
    fontSize: '16px',
    labelGap: '12px',
    verticalLength: '240px',
  },
  xl: {
    trackThickness: '12px',
    thumbSize: '28px',
    fontSize: '18px',
    labelGap: '14px',
    verticalLength: '280px',
  },
} as const;

export const segmentedControlSizes = {
  xs: {
    height: '24px',
    fontSize: '11px',
    paddingX: '8px',
    iconSize: '12px',
    gap: '4px',
    innerPadding: '2px',
    verticalWidth: '100px',
  },
  sm: {
    height: '28px',
    fontSize: '12px',
    paddingX: '10px',
    iconSize: '14px',
    gap: '6px',
    innerPadding: '3px',
    verticalWidth: '120px',
  },
  md: {
    height: '40px',
    fontSize: '14px',
    paddingX: '16px',
    iconSize: '16px',
    gap: '8px',
    innerPadding: '4px',
    verticalWidth: '160px',
  },
  lg: {
    height: '48px',
    fontSize: '16px',
    paddingX: '20px',
    iconSize: '18px',
    gap: '10px',
    innerPadding: '5px',
    verticalWidth: '180px',
  },
  xl: {
    height: '56px',
    fontSize: '18px',
    paddingX: '24px',
    iconSize: '20px',
    gap: '12px',
    innerPadding: '6px',
    verticalWidth: '200px',
  },
} as const;

export const chatTokens = {
  avatarSize: '32px',
  avatarRadius: '9999px',
  bubbleRadius: '16px',
  bubbleRadiusSmall: '6px',
  bubbleMaxWidth: '75%',
  bubblePaddingX: '14px',
  bubblePaddingY: '10px',
  messageGap: '20px',
  messageInnerGap: '10px',
  metaGap: '4px',
  metaFontSize: '12px',
  contentFontSize: '14px',
  contentLineHeight: '1.55',
  composerRadius: '20px',
  composerMinHeight: '44px',
  composerMaxHeight: '200px',
  composerPaddingX: '8px',
  composerPaddingY: '6px',
  composerToolbarGap: '4px',
  composerActionSize: '32px',
  composerActionRadius: '16px',
  composerActionIconSize: '16px',
  toolCardRadius: '12px',
  toolCardPaddingX: '14px',
  toolCardPaddingY: '10px',
  toolCardGap: '8px',
  citationChipHeight: '24px',
  citationChipPaddingX: '8px',
  citationChipRadius: '12px',
  typingDotSize: '6px',
  typingDotGap: '4px',
} as const;

export const popoverTokens = {
  minWidth: '160px',
  maxWidth: '320px',
  paddingX: '14px',
  paddingY: '12px',
  radius: '12px',
  offset: '8px',
  arrowSize: '10px',
  arrowInset: '12px',
  headerPaddingY: '10px',
  headerFontSize: '14px',
  headerFontWeight: 600,
  footerPaddingY: '10px',
  bodyFontSize: '13px',
  bodyLineHeight: 1.5,
  enterDuration: '200ms',
  exitDuration: '150ms',
  enterTranslate: '6px',
} as const;

export const tooltipTokens = {
  paddingX: '8px',
  paddingY: '5px',
  radius: '8px',
  fontSize: '12px',
  lineHeight: 1.4,
  fontWeight: 500,
  maxWidth: '240px',
  offset: '6px',
  arrowSize: '6px',
  bgLight: 'rgba(28, 28, 30, 0.92)',
  bgDark: 'rgba(242, 242, 247, 0.95)',
  fgLight: '#ffffff',
  fgDark: '#0a0a0a',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
  enterDelay: '120ms',
  exitDelay: '80ms',
  warmThreshold: '500ms',
  enterDuration: '120ms',
  enterTranslate: '4px',
} as const;

export const modalTokens = {
  widthSm: '420px',
  widthMd: '560px',
  widthLg: '720px',
  widthXl: '960px',
  widthFull: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 64px)',
  radius: '16px',
  headerPaddingX: '24px',
  headerPaddingY: '20px',
  headerFontSize: '18px',
  headerFontWeight: 600,
  bodyPaddingX: '24px',
  bodyPaddingY: '20px',
  bodyFontSize: '14px',
  bodyLineHeight: 1.55,
  footerPaddingX: '24px',
  footerPaddingY: '16px',
  footerGap: '8px',
  closeButtonSize: '32px',
  closeButtonRadius: '10px',
  closeButtonOffset: '12px',
  overlayBlur: '8px',
  shadow: '0 24px 64px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)',
  shadowDark: '0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  overlayDuration: '180ms',
  panelDuration: '250ms',
  panelEnterTranslateY: '8px',
  panelEnterScale: 0.985,
} as const;

export const tabsSizes = {
  xs: {
    height: '28px',
    fontSize: '12px',
    paddingX: '10px',
    gap: '4px',
    iconSize: '13px',
  },
  sm: {
    height: '32px',
    fontSize: '13px',
    paddingX: '12px',
    gap: '6px',
    iconSize: '14px',
  },
  md: {
    height: '40px',
    fontSize: '14px',
    paddingX: '16px',
    gap: '8px',
    iconSize: '16px',
  },
  lg: {
    height: '48px',
    fontSize: '16px',
    paddingX: '20px',
    gap: '10px',
    iconSize: '18px',
  },
  xl: {
    height: '56px',
    fontSize: '18px',
    paddingX: '24px',
    gap: '12px',
    iconSize: '20px',
  },
} as const;

export const tabsTokens = {
  listGap: '4px',
  underlineThickness: '2px',
  underlineRadius: '2px',
  underlineBottomOffset: '0px',
  underlineTrackBorder: '1px',
  pillsRadius: '10px',
  pillsTrackPadding: '4px',
  pillsTrackRadius: '12px',
  borderedRadius: '12px',
  itemFontWeightDefault: 500,
  itemFontWeightActive: 600,
  panelPaddingY: '20px',
  indicatorDuration: '250ms',
  colorDuration: '120ms',
} as const;

export const paginationSizes = {
  xs: {
    itemSize: '24px',
    fontSize: '11px',
    gap: '3px',
    radius: '6px',
    jumperWidth: '44px',
  },
  sm: {
    itemSize: '28px',
    fontSize: '12px',
    gap: '4px',
    radius: '8px',
    jumperWidth: '52px',
  },
  md: {
    itemSize: '40px',
    fontSize: '14px',
    gap: '6px',
    radius: '12px',
    jumperWidth: '64px',
  },
  lg: {
    itemSize: '48px',
    fontSize: '16px',
    gap: '8px',
    radius: '14px',
    jumperWidth: '72px',
  },
  xl: {
    itemSize: '56px',
    fontSize: '18px',
    gap: '10px',
    radius: '16px',
    jumperWidth: '80px',
  },
} as const;

export const paginationTokens = {
  sizeSelectorMinWidth: '88px',
  itemBorder: '1px',
  hoverDuration: '120ms',
} as const;

export const tableDensities = {
  compact: {
    rowHeight: '36px',
    cellPaddingY: '6px',
    cellPaddingX: '12px',
    fontSize: '13px',
  },
  default: {
    rowHeight: '44px',
    cellPaddingY: '10px',
    cellPaddingX: '16px',
    fontSize: '14px',
  },
  comfortable: {
    rowHeight: '56px',
    cellPaddingY: '14px',
    cellPaddingX: '20px',
    fontSize: '14px',
  },
} as const;

export const tableTokens = {
  headerFontSize: '12px',
  headerFontWeight: 600,
  headerLetterSpacing: '0.02em',
  headerHeight: '40px',
  headerBorderBottom: '1px',
  rowBorderBottom: '1px',
  cellLineHeight: 1.5,
  sortIconSize: '14px',
  sortIconGap: '6px',
  selectionColumnWidth: '44px',
  expandColumnWidth: '36px',
  stickyHeaderShadow: '0 1px 0 0 rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06)',
  stickyColumnShadowLeft: '4px 0 6px -4px rgba(0, 0, 0, 0.12)',
  stickyColumnShadowRight: '-4px 0 6px -4px rgba(0, 0, 0, 0.12)',
  containerRadius: '12px',
  containerBorder: '1px',
  emptyMinHeight: '180px',
  emptyFontSize: '14px',
  resizeHandleWidth: '4px',
  rowHoverDuration: '120ms',
  expandDuration: '200ms',
} as const;

export const drawerTokens = {
  widthSm: '320px',
  widthMd: '420px',
  widthLg: '560px',
  widthXl: '720px',
  widthFull: 'calc(100vw - 48px)',
  heightSm: '240px',
  heightMd: '360px',
  heightLg: '50vh',
  heightFull: 'calc(100vh - 48px)',
  radius: '16px',
  headerPaddingX: '24px',
  headerPaddingY: '20px',
  headerFontSize: '18px',
  headerFontWeight: 600,
  bodyPaddingX: '24px',
  bodyPaddingY: '20px',
  bodyFontSize: '14px',
  bodyLineHeight: 1.55,
  footerPaddingX: '24px',
  footerPaddingY: '16px',
  footerGap: '8px',
  closeButtonSize: '32px',
  closeButtonRadius: '10px',
  closeButtonOffset: '12px',
  overlayBlur: '8px',
  shadow: '0 24px 64px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)',
  shadowDark: '0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  overlayDuration: '180ms',
  panelDuration: '280ms',
  panelEnterTranslate: '100%',
  resizableHandleSize: '6px',
} as const;

export const toastTokens = {
  width: '360px',
  maxWidth: 'calc(100vw - 32px)',
  minHeight: '52px',
  paddingX: '14px',
  paddingY: '12px',
  radius: '12px',
  gap: '12px',
  iconSize: '20px',
  iconGap: '12px',
  titleFontSize: '14px',
  titleFontWeight: 600,
  descFontSize: '13px',
  descLineHeight: 1.5,
  descGap: '4px',
  actionGap: '8px',
  closeButtonSize: '24px',
  closeButtonRadius: '6px',
  closeButtonOffset: '6px',
  viewportPadding: '16px',
  viewportMaxStack: 5,
  shadow: '0 8px 24px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.06)',
  shadowDark: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  enterDuration: '220ms',
  exitDuration: '180ms',
  enterTranslate: '16px',
  swipeThreshold: '60px',
  defaultTimeout: 5000,
  progressBarHeight: '2px',
} as const;

export const menuTokens = {
  minWidth: '152px',
  maxWidth: '320px',
  maxHeight: '320px',
  paddingY: '6px',
  panelPaddingX: '6px',
  radius: '12px',
  offset: '6px',
  itemHeight: '36px',
  itemPaddingX: '8px',
  itemPaddingY: '6px',
  itemRadius: '8px',
  itemGap: '10px',
  itemFontSize: '13px',
  itemIconSize: '16px',
  shortcutFontSize: '12px',
  shortcutLetterSpacing: '0.02em',
  sectionLabelHeight: '28px',
  sectionLabelPaddingX: '8px',
  sectionLabelFontSize: '11px',
  sectionLabelFontWeight: 600,
  sectionLabelLetterSpacing: '0.04em',
  dividerHeight: '1px',
  dividerMarginY: '4px',
  submenuOffset: '4px',
  submenuTriggerIconSize: '14px',
  shadow: '0 8px 24px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06)',
  shadowDark: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  enterDuration: '160ms',
  exitDuration: '120ms',
  enterTranslate: '4px',
} as const;

export const datePickerTokens = {
  panelMinWidth: '280px',
  panelRangeMinWidth: '560px',
  panelPaddingX: '16px',
  panelPaddingY: '14px',
  panelRadius: '12px',
  panelOffset: '8px',
  panelGap: '16px',
  shadow: '0 12px 32px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06)',
  shadowDark: '0 12px 32px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  headerHeight: '36px',
  headerFontSize: '14px',
  headerFontWeight: 600,
  headerNavButtonSize: '28px',
  headerNavButtonRadius: '8px',
  headerNavIconSize: '16px',
  headerGap: '8px',
  weekdayHeight: '28px',
  weekdayFontSize: '11px',
  weekdayFontWeight: 500,
  weekdayLetterSpacing: '0.04em',
  cellSize: '36px',
  cellRadius: '8px',
  cellFontSize: '13px',
  cellFontWeight: 500,
  cellGap: '0px',
  cellTodayDotSize: '4px',
  cellTodayDotOffset: '4px',
  rangeBgRadius: '0px',
  rangeEndRadius: '8px',
  rangePreviewOpacity: 0.5,
  monthSlideDuration: '220ms',
  monthSlideTranslate: '12px',
  footerHeight: '44px',
  footerPaddingX: '12px',
  footerGap: '8px',
  footerBorderTop: '1px',
  inputIconSize: '16px',
  inputCalendarOffset: '4px',
  timeColumnWidth: '56px',
  timeItemHeight: '32px',
  timeItemRadius: '6px',
  timeItemFontSize: '13px',
} as const;

export const avatarSizes = {
  xs: { size: '24px', fontSize: '11px', borderWidth: '1px', statusDotSize: '6px' },
  sm: { size: '32px', fontSize: '13px', borderWidth: '2px', statusDotSize: '8px' },
  md: { size: '40px', fontSize: '15px', borderWidth: '2px', statusDotSize: '10px' },
  lg: { size: '48px', fontSize: '18px', borderWidth: '2px', statusDotSize: '12px' },
  xl: { size: '80px', fontSize: '28px', borderWidth: '3px', statusDotSize: '16px' },
} as const;

export const avatarTokens = {
  circleRadius: '9999px',
  squareRadius: '8px',
  fallbackFontWeight: 600,
  groupOverlap: '-8px',
  groupBorderWidth: '2px',
  statusDotBorderWidth: '2px',
  statusDotOffset: '2px',
  loadingPlaceholderDuration: '1.4s',
} as const;

export const tagSizes = {
  xs: {
    height: '16px',
    paddingX: '4px',
    gap: '3px',
    fontSize: '10px',
    radius: '6px',
    iconSize: '10px',
    closeSize: '10px',
  },
  sm: {
    height: '20px',
    paddingX: '6px',
    gap: '4px',
    fontSize: '11px',
    radius: '8px',
    iconSize: '12px',
    closeSize: '12px',
  },
  md: {
    height: '24px',
    paddingX: '8px',
    gap: '6px',
    fontSize: '12px',
    radius: '8px',
    iconSize: '14px',
    closeSize: '14px',
  },
  lg: {
    height: '28px',
    paddingX: '10px',
    gap: '6px',
    fontSize: '13px',
    radius: '8px',
    iconSize: '16px',
    closeSize: '16px',
  },
  xl: {
    height: '32px',
    paddingX: '12px',
    gap: '8px',
    fontSize: '14px',
    radius: '10px',
    iconSize: '18px',
    closeSize: '18px',
  },
} as const;

export const tagTokens = {
  fontWeight: 500,
  outlineBorderWidth: '1px',
  closeButtonRadius: '4px',
  closeIconStrokeWidth: '1.5px',
  pillRadius: '9999px',
  dotSize: '6px',
  hoverOpacity: 0.85,
  activeOpacity: 0.7,
  transitionDuration: '120ms',
} as const;

export const badgeTokens = {
  standardHeight: '18px',
  standardMinWidth: '18px',
  standardPaddingX: '5px',
  standardFontSize: '12px',
  standardFontWeight: 600,
  standardRadius: '9999px',
  standardBorderWidth: '2px',
  dotSize: '8px',
  dotBorderWidth: '2px',
  offsetTopRight: 'translate(35%, -35%)',
  offsetBottomRight: 'translate(35%, 35%)',
  offsetTopLeft: 'translate(-35%, -35%)',
  offsetBottomLeft: 'translate(-35%, 35%)',
  standaloneRadius: '9999px',
  pulseDuration: '1.6s',
  enterDuration: '160ms',
  enterScale: 0.6,
  maxOverflowSuffix: '+',
} as const;

export const skeletonTokens = {
  textHeightSm: '12px',
  textHeightMd: '14px',
  textHeightLg: '18px',
  textRadius: '4px',
  textGap: '8px',
  textLastLineWidth: '60%',
  rectRadius: '8px',
  circleRadius: '9999px',
  shimmerDuration: '1.4s',
  shimmerAngle: '90deg',
  shimmerWidth: '200%',
  pulseDuration: '1.6s',
  pulseMinOpacity: 0.5,
  pulseMaxOpacity: 1,
  groupGap: '12px',
} as const;

export const emptyTokens = {
  paddingX: '24px',
  paddingY: '40px',
  gap: '16px',
  imageSizeXs: '56px',
  imageSizeSm: '80px',
  imageSizeMd: '120px',
  imageSizeLg: '160px',
  imageSizeXl: '200px',
  titleFontSize: '16px',
  titleFontWeight: 600,
  titleLineHeight: 1.4,
  descFontSize: '13px',
  descLineHeight: 1.55,
  descMaxWidth: '360px',
  descGap: '4px',
  actionsGap: '8px',
  actionsMarginTop: '8px',
  inlinePaddingY: '24px',
  inlineImageSize: '64px',
  inlineTitleFontSize: '13px',
  inlineDescFontSize: '12px',
} as const;

export const stepsSizes = {
  xs: {
    iconSize: '16px',
    fontSize: '11px',
    titleFontSize: '12px',
    descFontSize: '10px',
    connectorThickness: '1px',
    itemGap: '6px',
  },
  sm: {
    iconSize: '20px',
    fontSize: '12px',
    titleFontSize: '13px',
    descFontSize: '11px',
    connectorThickness: '1px',
    itemGap: '8px',
  },
  md: {
    iconSize: '28px',
    fontSize: '14px',
    titleFontSize: '14px',
    descFontSize: '12px',
    connectorThickness: '2px',
    itemGap: '12px',
  },
  lg: {
    iconSize: '36px',
    fontSize: '16px',
    titleFontSize: '16px',
    descFontSize: '13px',
    connectorThickness: '2px',
    itemGap: '16px',
  },
  xl: {
    iconSize: '44px',
    fontSize: '18px',
    titleFontSize: '18px',
    descFontSize: '14px',
    connectorThickness: '3px',
    itemGap: '20px',
  },
} as const;

export const stepsTokens = {
  iconRadius: '9999px',
  iconFontWeight: 600,
  iconBorderWidth: '2px',
  connectorMinLength: '40px',
  connectorRadius: '1px',
  connectorOffset: '8px',
  itemPaddingY: '4px',
  verticalConnectorWidth: '2px',
  verticalIndent: '12px',
  verticalItemMinHeight: '64px',
  verticalDescGap: '4px',
  dotSize: '10px',
  dotActiveSize: '14px',
  iconTransitionDuration: '200ms',
  connectorFillDuration: '320ms',
} as const;

export const calloutTokens = {
  marginY: '16px',
  paddingX: '18px',
  paddingY: '16px',
  borderLeftWidth: '2px',
  radius: '2px',
  gap: '10px',
  iconFontSize: '14px',
  iconPaddingTop: '2px',
  iconMinWidth: '14px',
  titleFontSize: '14px',
  titleFontWeight: 600,
  titleLineHeight: 1.4,
  titleMarginBottom: '4px',
  bodyFontSize: '14px',
  bodyLineHeight: 1.65,
} as const;

export const multiSelectTokens = {
  /** trigger 内 chip 之间间距 */
  chipGap: '4px',
  /** trigger 内容区上下 padding（让 chip 不贴边）—— 对应 size */
  triggerPaddingY: {
    xs: '2px',
    sm: '2px',
    md: '3px',
    lg: '4px',
    xl: '4px',
  },
  /** option 行的 indicator 与 label 之间 gap */
  optionIndicatorGap: '10px',
  /** option 行内边距（与 Select option 一致，便于视觉同源） */
  optionPaddingY: '7px',
  optionPaddingX: '10px',
  optionRadius: '6px',
  /** dropdown toolbar 高度与排版 */
  toolbarHeight: '32px',
  toolbarPaddingY: '6px',
  toolbarPaddingX: '10px',
  toolbarFontSize: '12px',
  /** OptGroup heading 视觉 */
  optGroupHeadingHeight: '24px',
  optGroupHeadingPaddingTop: '6px',
  optGroupHeadingPaddingBottom: '4px',
  optGroupHeadingPaddingX: '10px',
  optGroupHeadingFontSize: '11px',
  optGroupHeadingFontWeight: 600,
  optGroupHeadingLetterSpacing: '0.04em',
  /** chip label 截断的最大宽度 */
  chipMaxWidth: '12em',
  /** type-ahead 缓冲超时（毫秒） */
  typeAheadTimeoutMs: 800,
} as const;

export const components = {
  button: buttonSizes,
  input: inputSizes,
  checkbox: checkboxSizes,
  switch: switchSizes,
  slider: sliderSizes,
  segmentedControl: segmentedControlSizes,
  chat: chatTokens,
  popover: popoverTokens,
  tooltip: tooltipTokens,
  modal: modalTokens,
  tabsSize: tabsSizes,
  tabs: tabsTokens,
  paginationSize: paginationSizes,
  pagination: paginationTokens,
  tableDensity: tableDensities,
  table: tableTokens,
  drawer: drawerTokens,
  toast: toastTokens,
  menu: menuTokens,
  datePicker: datePickerTokens,
  avatarSize: avatarSizes,
  avatar: avatarTokens,
  tagSize: tagSizes,
  tag: tagTokens,
  badge: badgeTokens,
  skeleton: skeletonTokens,
  empty: emptyTokens,
  stepsSize: stepsSizes,
  steps: stepsTokens,
  callout: calloutTokens,
  multiSelect: multiSelectTokens,
} as const;

export type ButtonSizes = typeof buttonSizes;
export type InputSizes = typeof inputSizes;
export type CheckboxSizes = typeof checkboxSizes;
export type SwitchSizes = typeof switchSizes;
export type SliderSizes = typeof sliderSizes;
export type SegmentedControlSizes = typeof segmentedControlSizes;
export type ChatTokens = typeof chatTokens;
export type PopoverTokens = typeof popoverTokens;
export type TooltipTokens = typeof tooltipTokens;
export type ModalTokens = typeof modalTokens;
export type TabsSizes = typeof tabsSizes;
export type TabsTokens = typeof tabsTokens;
export type PaginationSizes = typeof paginationSizes;
export type PaginationTokens = typeof paginationTokens;
export type TableDensities = typeof tableDensities;
export type TableTokens = typeof tableTokens;
export type DrawerTokens = typeof drawerTokens;
export type ToastTokens = typeof toastTokens;
export type MenuTokens = typeof menuTokens;
export type DatePickerTokens = typeof datePickerTokens;
export type AvatarSizes = typeof avatarSizes;
export type AvatarTokens = typeof avatarTokens;
export type TagSizes = typeof tagSizes;
export type TagTokens = typeof tagTokens;
export type BadgeTokens = typeof badgeTokens;
export type SkeletonTokens = typeof skeletonTokens;
export type EmptyTokens = typeof emptyTokens;
export type StepsSizes = typeof stepsSizes;
export type StepsTokens = typeof stepsTokens;
export type CalloutTokens = typeof calloutTokens;
export type MultiSelectTokens = typeof multiSelectTokens;
export type Components = typeof components;
