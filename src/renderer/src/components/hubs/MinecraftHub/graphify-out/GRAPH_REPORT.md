# Graph Report - D:\\github\\OmniHost\\src\\renderer\\src\\components\\hubs\\MinecraftHub (2026-08-26)

## Corpus Check

- Corpus is ~1,175 words - fits in a single context window. You may not need a graph.

## Summary

- 6 nodes · 5 edges · 1 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals

- Entity graph basis: 5 non-file, non-concept node(s)
- Weakly connected components: 1
- Singleton components: 0
- Isolated nodes: 0
- Largest component: 5 node(s) (100% of the entity graph basis)
- Low-cohesion communities: 0
- Largest low-cohesion community: none on the entity graph basis

## Workspace Bridges

- None detected - no entity nodes currently connect multiple communities.

## God Nodes

1. `MinecraftHub\(\)` - 5 edges
2. `fetchServerMeta\(\)` - 1 edges
3. `handleTabChange\(\)` - 1 edges
4. `handleTunnel\(\)` - 1 edges
5. `onRedirectToCreateModpack\(\)` - 1 edges

## Surprising Connections

- None detected - all connections are within the same source files.

## Semantic Anomalies

- None detected - the graph currently looks structurally well-behaved.

## Communities

### Community 0 - "Minecraft Hub"

Cohesion (entity basis within full-graph community): 0.4
Nodes (5): MinecraftHub\(\), fetchServerMeta\(\), handleTabChange\(\), handleTunnel\(\), onRedirectToCreateModpack\(\)

## Knowledge Gaps

- **4 weakly connected node(s):** `handleTunnel\(\)`, `onRedirectToCreateModpack\(\)`, `handleTabChange\(\)`, `fetchServerMeta\(\)`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **What connects \`handleTunnel\(\)\`, \`onRedirectToCreateModpack\(\)\`, \`handleTabChange\(\)\` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
