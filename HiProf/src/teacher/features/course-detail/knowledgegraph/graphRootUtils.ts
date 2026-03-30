type NodeIdValue = string | number | null | undefined;

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

const normalizeNodeId = (value: NodeIdValue): string => {
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

export const resolveTopLevelNodeIds = (nodes: RootCandidateNode[]): string[] => {
  const existingIds = new Set(
    nodes
      .map(node => normalizeNodeId(node.id))
      .filter(nodeId => Boolean(nodeId))
  );

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

export const isVirtualRootNode = (node: VirtualRootLike | null | undefined): boolean => {
  if (!node) {
    return false;
  }

  return node.id === VIRTUAL_ROOT_NODE_ID || node.isVirtualRoot === true || node.data?.isVirtualRoot === true;
};
