const normalizeGraphNodeId = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const normalizeSet = (values) => {
  if (values instanceof Set) {
    return new Set(Array.from(values).map(normalizeGraphNodeId).filter(Boolean));
  }

  if (Array.isArray(values)) {
    return new Set(values.map(normalizeGraphNodeId).filter(Boolean));
  }

  return new Set();
};

const sanitizeClassPart = (value) => {
  return String(value || 'default')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';
};

const getLineKey = (line) => {
  return normalizeGraphNodeId(line?.id) || `${normalizeGraphNodeId(line?.from)}__${normalizeGraphNodeId(line?.to)}`;
};

export const graphVisualTheme = {
  canvas: {
    background: '#f8fafc'
  },
  node: {
    root: {
      color: '#0f766e',
      borderColor: '#0f766e',
      fontColor: '#ffffff',
      borderWidth: 2
    },
    chapter: {
      color: '#ffffff',
      borderColor: '#0ea5e9',
      fontColor: '#0f172a',
      borderWidth: 2
    },
    default: {
      color: '#ffffff',
      borderColor: '#cbd5e1',
      fontColor: '#1e293b',
      borderWidth: 1
    }
  },
  category: {
    concept: '#16a34a',
    principle: '#7c3aed',
    method: '#ea580c',
    tool: '#0891b2',
    application: '#2563eb',
    branch: '#64748b',
    history: '#be123c',
    structure: '#475569',
    analysis: '#9333ea',
    property: '#0f766e',
    material: '#b45309',
    default: '#64748b'
  },
  line: {
    default: '#111827',
    hover: '#000000',
    active: '#000000',
    muted: '#111827'
  },
  lineMarker: {
    markerWidth: 16,
    markerHeight: 16,
    refX: 13,
    refY: 8,
    data: 'M2,2 L14,8 L2,14 L5,8 Z'
  }
};

export const getNodeCategory = (node) => {
  return node?.category || node?.data?.category || node?.data?.originalData?.category || 'default';
};

export const getNodeStyleByType = (nodeType, category = 'default') => {
  if (nodeType === 'root' || nodeType === 'virtual-root') {
    return graphVisualTheme.node.root;
  }

  if (nodeType === 'chapter') {
    return {
      ...graphVisualTheme.node.chapter,
      borderColor: graphVisualTheme.category[category] || graphVisualTheme.node.chapter.borderColor
    };
  }

  return {
    ...graphVisualTheme.node.default,
    borderColor: graphVisualTheme.category[category] || graphVisualTheme.node.default.borderColor
  };
};

export const getGraphNodeType = (node, context = {}) => {
  const nodeId = normalizeGraphNodeId(node?.id);
  const rootIds = normalizeSet(context.rootIds);
  const chapterNodeIds = normalizeSet(context.chapterNodeIds);

  if (node?.data?.isVirtualRoot || node?.isVirtualRoot || node?.data?.isCenterRoot) {
    return 'root';
  }

  if (rootIds.has(nodeId) || normalizeGraphNodeId(context.rootId) === nodeId) {
    return 'root';
  }

  if (chapterNodeIds.has(nodeId)) {
    return 'chapter';
  }

  return 'default';
};

export const buildGraphRelationSets = (selectedNodeId, lines = []) => {
  const selectedId = normalizeGraphNodeId(selectedNodeId);
  const relatedNodeIds = new Set();
  const activeLineIds = new Set();

  if (!selectedId) {
    return {
      selectedNodeId: '',
      relatedNodeIds,
      activeLineIds
    };
  }

  lines.forEach((line) => {
    const fromId = normalizeGraphNodeId(line?.from);
    const toId = normalizeGraphNodeId(line?.to);

    if (fromId === selectedId || toId === selectedId) {
      if (fromId && fromId !== selectedId) {
        relatedNodeIds.add(fromId);
      }
      if (toId && toId !== selectedId) {
        relatedNodeIds.add(toId);
      }
      activeLineIds.add(getLineKey(line));
    }
  });

  return {
    selectedNodeId: selectedId,
    relatedNodeIds,
    activeLineIds
  };
};

export const getNodeInteractionState = (nodeId, relationSets) => {
  const normalizedNodeId = normalizeGraphNodeId(nodeId);
  const selectedNodeId = normalizeGraphNodeId(relationSets?.selectedNodeId);

  if (!selectedNodeId) {
    return 'default';
  }

  if (normalizedNodeId === selectedNodeId) {
    return 'selected';
  }

  if (relationSets?.relatedNodeIds?.has(normalizedNodeId)) {
    return 'related';
  }

  return 'muted';
};

export const getLineInteractionState = (line, relationSets) => {
  if (!normalizeGraphNodeId(relationSets?.selectedNodeId)) {
    return 'default';
  }

  return relationSets?.activeLineIds?.has(getLineKey(line)) ? 'active' : 'muted';
};

export const getNodeStyleClass = (node, context = {}) => {
  const category = sanitizeClassPart(getNodeCategory(node));
  const nodeType = context.nodeType || getGraphNodeType(node, context);
  const state = context.state || getNodeInteractionState(node?.id, context.relationSets);
  const branchSide = node?.data?.branchSide ? `kg-graph-node-branch-${sanitizeClassPart(node.data.branchSide)}` : '';

  return [
    'kg-graph-node',
    `kg-graph-node-${sanitizeClassPart(nodeType)}`,
    `kg-graph-node-category-${category}`,
    branchSide,
    state && state !== 'default' ? `kg-graph-node-${state}` : ''
  ].filter(Boolean).join(' ');
};

export const applyGraphVisualNodeStyle = (node, context = {}) => {
  const nodeType = getGraphNodeType(node, context);
  const category = getNodeCategory(node);
  const state = getNodeInteractionState(node?.id, context.relationSets);
  const style = getNodeStyleByType(nodeType, category);

  return {
    ...node,
    nodeShape: 1,
    color: style.color,
    borderColor: style.borderColor,
    fontColor: style.fontColor,
    borderWidth: style.borderWidth,
    styleClass: getNodeStyleClass(node, {
      ...context,
      nodeType,
      state
    })
  };
};

export const getLineStyleByState = (state = 'default') => {
  const color = graphVisualTheme.line[state] || graphVisualTheme.line.default;
  let lineWidth = 2;
  if (state === 'active') {
    lineWidth = 3;
  } else if (state === 'muted') {
    lineWidth = 1.4;
  }

  return {
    color,
    lineWidth,
    fontColor: state === 'active' ? graphVisualTheme.line.active : '#64748b'
  };
};

export const applyGraphVisualLineStyle = (line, state = 'default') => {
  const style = getLineStyleByState(state);

  return {
    ...line,
    color: style.color,
    lineWidth: style.lineWidth,
    fontColor: style.fontColor,
    showStartArrow: false,
    showEndArrow: true,
    isHideArrow: false,
    styleClass: [
      'kg-graph-line',
      state && state !== 'default' ? `kg-graph-line-${state}` : ''
    ].filter(Boolean).join(' ')
  };
};

export const searchGraphNodes = (keyword, nodes = []) => {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();
  if (!normalizedKeyword) {
    return [];
  }

  return nodes.filter((node) => {
    const candidates = [
      node?.text,
      node?.name,
      node?.label,
      node?.data?.fullText,
      node?.data?.content,
      node?.data?.originalData?.name,
      node?.data?.originalData?.content
    ];

    return candidates.some((candidate) => String(candidate || '').toLowerCase().includes(normalizedKeyword));
  });
};

export const buildGraphVisualContext = ({ rootIds, chapterNodeIds, selectedNodeId, lines }) => {
  return {
    rootIds: normalizeSet(rootIds),
    chapterNodeIds: normalizeSet(chapterNodeIds),
    relationSets: buildGraphRelationSets(selectedNodeId, lines)
  };
};
