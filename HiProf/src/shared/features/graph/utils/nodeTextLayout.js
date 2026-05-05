const DEFAULT_LIMITS = {
  minWidth: 140,
  maxWidth: 240,
  minHeight: 48,
  lineHeight: 20,
  verticalPadding: 16,
  horizontalPadding: 24,
  maxLines: 3
};

const getTextUnits = (text) => Array.from(String(text || '')).reduce((total, char) => {
  return total + (/[\u4e00-\u9fff]/.test(char) ? 1 : 0.6);
}, 0);

const getUnitsPerLine = (units) => {
  if (units <= 10) return 10;
  if (units <= 24) return 12;
  return 14;
};

export const escapeNodeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const measureRelationGraphNodeText = (text, options = {}) => {
  const limits = { ...DEFAULT_LIMITS, ...options };
  const units = getTextUnits(text);
  const perLineUnits = getUnitsPerLine(units);
  const lineCount = Math.min(Math.max(Math.ceil(units / perLineUnits), 1), limits.maxLines);
  const width = Math.min(Math.max(Math.ceil(perLineUnits * 14 + limits.horizontalPadding), limits.minWidth), limits.maxWidth);
  const height = Math.max(limits.minHeight, lineCount * limits.lineHeight + limits.verticalPadding);
  return { width, height, lineCount, maxLines: limits.maxLines };
};

export const buildRelationGraphNodeHtml = (text) => {
  const safeText = escapeNodeHtml(text);
  return `<div class="kg-node-label" title="${safeText}">${safeText}</div>`;
};

export const applyRelationGraphNodeTextLayout = (node, options = {}) => {
  const displayText = String(node.text || node.name || node.label || '').trim();
  const metrics = measureRelationGraphNodeText(displayText, options);
  const nodeHtml = buildRelationGraphNodeHtml(displayText);
  const borderWidth = node.borderWidth ?? (node.borderColor ? 2 : undefined);

  return {
    ...node,
    text: displayText,
    width: metrics.width,
    height: metrics.height,
    ...(borderWidth === undefined ? {} : { borderWidth }),
    innerHTML: nodeHtml,
    data: {
      ...(node.data || {}),
      fullText: displayText,
      textMetrics: metrics
    }
  };
};

export const getMaxRelationGraphNodeSize = (nodes) => {
  return nodes.reduce((result, node) => ({
    width: Math.max(result.width, Number(node.width || 0)),
    height: Math.max(result.height, Number(node.height || 0))
  }), { width: DEFAULT_LIMITS.minWidth, height: DEFAULT_LIMITS.minHeight });
};
