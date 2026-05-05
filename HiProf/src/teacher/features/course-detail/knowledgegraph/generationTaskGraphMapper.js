import { applyRelationGraphNodeTextLayout } from '@/shared/features/graph/utils/nodeTextLayout.js';

const normalizeParentId = (value) => {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0') return 'root';
  return String(value);
};

export const mapTaskResultToDraftGraph = (result, courseName = '课程知识图谱') => {
  const rawNodes = Array.isArray(result?.nodes) ? result.nodes : [];
  const rootNode = applyRelationGraphNodeTextLayout({
    id: 'draft-root',
    text: result?.graphTitle || courseName,
    color: 'rgba(245, 158, 11, 0.16)',
    borderColor: '#f59e0b',
    fontColor: '#111827',
    data: { content: result?.summary || '', category: 'draft-root' }
  });
  const nodes = rawNodes.map(node => applyRelationGraphNodeTextLayout({
    id: String(node.id),
    text: node.title || node.name || node.label || `节点${node.id}`,
    color: 'rgba(0, 206, 209, 0.1)',
    borderColor: 'rgba(0, 206, 209, 1)',
    fontColor: '#111827',
    data: { content: node.content || node.description || '', originalData: node }
  }));
  const nodeIdSet = new Set(nodes.map(node => String(node.id)));
  const links = rawNodes.map((node, index) => {
    const parentId = normalizeParentId(node.parentId);
    return {
      id: `draft_line_${index}`,
      from: parentId === 'root' || !nodeIdSet.has(parentId) ? 'draft-root' : parentId,
      to: String(node.id),
      text: ''
    };
  });
  return { rootId: 'draft-root', nodes: [rootNode, ...nodes], links };
};
