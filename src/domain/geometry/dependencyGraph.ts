import type { BandEntity } from '@/domain/bands/types';
import type { DependencyGraph, DependencyNode } from '@/domain/geometry/types';

const createNode = (band: BandEntity, nowIso: string): DependencyNode => ({
  id: band.id,
  parentId: band.parentBandId,
  childrenIds: band.childBandIds,
  dependencyIds: band.relationships.map((relationship) => relationship.targetBandId),
  affectedObjectIds: [],
  dirty: false,
  lastUpdatedIso: nowIso
});

const detectCycle = (nodes: Record<string, DependencyNode>): boolean => {
  const visited = new Set<string>();
  const stack = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (stack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    stack.add(nodeId);

    const node = nodes[nodeId];
    if (!node) {
      stack.delete(nodeId);
      return false;
    }

    const links = [...node.childrenIds, ...node.dependencyIds];
    for (const linkId of links) {
      if (nodes[linkId] && dfs(linkId)) {
        return true;
      }
    }

    stack.delete(nodeId);
    return false;
  };

  return Object.keys(nodes).some((nodeId) => dfs(nodeId));
};

export const buildDependencyGraph = (bands: BandEntity[]): DependencyGraph => {
  const nowIso = new Date().toISOString();
  const nodes: Record<string, DependencyNode> = {};

  bands.forEach((band) => {
    nodes[band.id] = createNode(band, nowIso);
  });

  Object.values(nodes).forEach((node) => {
    const affected = new Set<string>();
    const queue = [...node.childrenIds];

    while (queue.length > 0) {
      const nextId = queue.shift();
      if (!nextId || affected.has(nextId)) {
        continue;
      }
      affected.add(nextId);
      const linkedNode = nodes[nextId];
      if (linkedNode) {
        queue.push(...linkedNode.childrenIds);
      }
    }

    node.affectedObjectIds = [...affected];
  });

  const hasCircularDependency = detectCycle(nodes);
  return { nodes, hasCircularDependency };
};

export const markDirtyFromNode = (graph: DependencyGraph, originNodeId: string): DependencyGraph => {
  const origin = graph.nodes[originNodeId];
  if (!origin) {
    return graph;
  }

  const nowIso = new Date().toISOString();
  const dirtyIds = new Set<string>([originNodeId, ...origin.affectedObjectIds]);
  const nextNodes: Record<string, DependencyNode> = {};

  Object.entries(graph.nodes).forEach(([id, node]) => {
    nextNodes[id] = {
      ...node,
      dirty: dirtyIds.has(id),
      lastUpdatedIso: dirtyIds.has(id) ? nowIso : node.lastUpdatedIso
    };
  });

  return {
    ...graph,
    nodes: nextNodes
  };
};
