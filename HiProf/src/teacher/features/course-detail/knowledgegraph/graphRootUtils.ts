type NodeIdValue = unknown;

interface RootCandidateNode {
  id?: NodeIdValue;
  parentId?: NodeIdValue;
}

interface VirtualRootLike {
  id?: string;
  data?: {
    isVirtualRoot?: boolean;
  } | null;
  isVirtualRoot?: boolean;
}

export const VIRTUAL_ROOT_NODE_ID = '__course_virtual_root__';

interface TreeRelationLine {
  from?: NodeIdValue;
  to?: NodeIdValue;
}

export const normalizeNodeId = (value: NodeIdValue): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized = String(value).trim();
  return normalized;
};

export const isEmptyParentId = (value: NodeIdValue): boolean => {
  const normalized = normalizeNodeId(value);
  return normalized === '' || normalized === '0';
};

const getExistingNodeIds = (nodes: RootCandidateNode[]): string[] => {
  return nodes
    .map(node => normalizeNodeId(node.id))
    .filter(nodeId => Boolean(nodeId));
};

export const resolveTopLevelNodeIds = (nodes: RootCandidateNode[]): string[] => {
  const existingIds = new Set(getExistingNodeIds(nodes));

  const rootIds: string[] = [];
  const seen = new Set<string>();

  nodes.forEach(node => {
    const nodeId = normalizeNodeId(node.id);
    if (!nodeId || seen.has(nodeId)) {
      return;
    }

    const parentId = normalizeNodeId(node.parentId);
    if (isEmptyParentId(node.parentId) || !parentId || !existingIds.has(parentId)) {
      rootIds.push(nodeId);
      seen.add(nodeId);
    }
  });

  return rootIds;
};

const addTreeChild = (childrenByParentId: Map<string, string[]>, parentId: string, childId: string) => {
  if (!parentId || !childId || parentId === childId) {
    return;
  }

  if (!childrenByParentId.has(parentId)) {
    childrenByParentId.set(parentId, []);
  }

  const childIds = childrenByParentId.get(parentId)!;
  if (!childIds.includes(childId)) {
    childIds.push(childId);
  }
};

export const buildTreeChildrenByParentId = (
  rawNodes: RootCandidateNode[],
  processedLines: TreeRelationLine[]
) => {
  const existingNodeIds = new Set(getExistingNodeIds(rawNodes));
  const childrenByParentId = new Map<string, string[]>();
  const hasParentRelations = rawNodes.some(node => {
    const nodeId = normalizeNodeId(node.id);
    const parentId = normalizeNodeId(node.parentId);
    return Boolean(nodeId && parentId && !isEmptyParentId(node.parentId) && existingNodeIds.has(parentId));
  });

  if (hasParentRelations) {
    rawNodes.forEach(node => {
      const nodeId = normalizeNodeId(node.id);
      const parentId = normalizeNodeId(node.parentId);
      if (!nodeId || isEmptyParentId(node.parentId) || !existingNodeIds.has(parentId)) {
        return;
      }

      addTreeChild(childrenByParentId, parentId, nodeId);
    });
    return childrenByParentId;
  }

  processedLines.forEach(line => {
    const fromId = normalizeNodeId(line.from);
    const toId = normalizeNodeId(line.to);
    if (existingNodeIds.has(fromId) && existingNodeIds.has(toId)) {
      addTreeChild(childrenByParentId, fromId, toId);
    }
  });

  return childrenByParentId;
};

export const resolveVisibleTreeNodeIds = (
  rootIds: string[],
  childrenByParentId: Map<string, string[]>,
  collapsedNodeIds: Set<string>
) => {
  const visibleNodeIds = new Set<string>();
  const visitedNodeIds = new Set<string>();

  const visit = (nodeId: string) => {
    if (!nodeId || visitedNodeIds.has(nodeId)) {
      return;
    }

    visitedNodeIds.add(nodeId);
    visibleNodeIds.add(nodeId);

    if (collapsedNodeIds.has(nodeId)) {
      return;
    }

    (childrenByParentId.get(nodeId) || []).forEach(visit);
  };

  rootIds.forEach(visit);
  return visibleNodeIds;
};

export const resolveTreeAncestorNodeIds = (
  targetNodeId: NodeIdValue,
  rawNodes: RootCandidateNode[],
  processedLines: TreeRelationLine[]
): string[] => {
  const normalizedTargetNodeId = normalizeNodeId(targetNodeId);
  if (!normalizedTargetNodeId) {
    return [];
  }

  const childrenByParentId = buildTreeChildrenByParentId(rawNodes, processedLines);
  const parentByChildId = new Map<string, string>();

  childrenByParentId.forEach((childIds, parentId) => {
    childIds.forEach(childId => {
      if (!parentByChildId.has(childId)) {
        parentByChildId.set(childId, parentId);
      }
    });
  });

  const ancestorNodeIds: string[] = [];
  const visitedNodeIds = new Set<string>([normalizedTargetNodeId]);
  let parentId = parentByChildId.get(normalizedTargetNodeId);

  while (parentId && !visitedNodeIds.has(parentId)) {
    ancestorNodeIds.push(parentId);
    visitedNodeIds.add(parentId);
    parentId = parentByChildId.get(parentId);
  }

  return ancestorNodeIds;
};

export const isVirtualRootNode = (node: VirtualRootLike | null | undefined): boolean => {
  if (!node) {
    return false;
  }

  return node.id === VIRTUAL_ROOT_NODE_ID || node.isVirtualRoot === true || node.data?.isVirtualRoot === true;
};
