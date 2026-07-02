import {
    DlangEdgeKind,
    DlangEntity,
    DlangFunction,
    DlangObject,
    EntityDict,
    GraphBuilder,
} from "./dlangModel.js";

function stringToId(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

export function generateGraphs(
    entitiesDict: EntityDict,
    graphBuilder: GraphBuilder
): string {
    // Keep diagram rendering in one block so the markdown structure is easy to follow.
    let markdown = "## Diagrams {#diagrams}\n\n";

    markdown += "### Class Diagram {#class-diagram}\n\n";
    markdown += generateClassDiagramMermaidGraph(entitiesDict, graphBuilder);
    markdown += "\n";

    markdown += "### Dependency Diagram {#dependency-diagram}\n\n";
    markdown += generateDependencyMermaidGraph(graphBuilder);

    markdown += "\n---\n\n";

    return markdown;
}

export function generateDependencyMermaidGraph(
    graphBuilder: GraphBuilder
): string {
    // Build the dependency graph from the entity edges collected during model conversion.
    let mermaid = "```mermaid\n";
    mermaid += "graph LR\n\n";

    const connectedNodes = new Set(
        graphBuilder.edges.flatMap(({ from, to }) => [from, to])
    );

    const cyclicEdgeIds = new Set(
        findCyclicEdgeIds(graphBuilder).map(({ from, to }) => `${stringToId(from)}-${stringToId(to)}`)
    );
    const looseNodeIds: string[] = [];

    for (const node of graphBuilder.nodes) {
        const nodeId = stringToId(node);

        mermaid += `${nodeId}["${node}"]\n`;

        if (!connectedNodes.has(node)) {
            looseNodeIds.push(nodeId);
        }
    }

    mermaid += "\n";

    const edgeStyles: string[] = [];

    for (const [index, edge] of graphBuilder.edges.entries()) {
        const fromId = stringToId(edge.from);
        const toId = stringToId(edge.to);
        const edgeId = `${fromId}-${toId}`;
        const edgeLabel = getDependencyRelation(edge.kind);

        mermaid += `${fromId} ${edgeLabel} ${toId}\n`;

        if (cyclicEdgeIds.has(edgeId)) {
            edgeStyles.push(`linkStyle ${index} stroke:#f44336,stroke-width:4px;`);
        }
    }

    // Highlight loose nodes so isolated entities are easy to spot in the graph.
    if (looseNodeIds.length > 0) {
        mermaid += "\n";
        mermaid +=
            "classDef loose fill:#ffebee,stroke:#f44336,stroke-width:4px;\n";
        mermaid += `class ${looseNodeIds.join(",")} loose;\n`;
    }

    if (edgeStyles.length > 0) {
        mermaid += "\n";
        mermaid += `${edgeStyles.join("\n")}\n`;
    }

    return mermaid + "```\n";
}

export function generateClassDiagramMermaidGraph(
    entitiesDict: EntityDict,
    graphBuilder: GraphBuilder,
): string {
    // Render each registered object once, then add the object-to-object relations below it.
    let mermaid = "```mermaid\n";
    mermaid += "classDiagram\n";
    mermaid += "direction LR\n\n";

    for (const entity of entitiesDict.values()) {
        if (!isObjectEntity(entity)) {
            continue;
        }

        mermaid += `class ${entity.name} {\n`;

        for (const member of entity.members) {
            const type = member.type;

            if (type?.kind === "unknown") continue;

            // Function member references are rendered as a function signature.
            if (type?.kind === "entity") {
                const referenced = entitiesDict.get(type.name);

                if (isFunctionEntity(referenced)) {
                    const returnType = referenced.returnType?.kind !== "unknown"
                        ? referenced.returnType?.name
                        : "void";

                    mermaid += `  ${returnType} ${member.name}: ${type.name}\n`;
                    continue;
                }
            }

            let line = "  ";

            if (type?.name) {
                line += `${type.name} `;
            }

            line += member.name;

            if (member.value !== undefined) {
                line += ` = ${member.value}`;
            }

            mermaid += `${line}\n`;
        }

        mermaid += "}\n\n";
    }

    for (const edge of graphBuilder.edges) {
        const fromEntity = entitiesDict.get(edge.from);
        const toEntity = entitiesDict.get(edge.to);

        if (!fromEntity || !toEntity) continue;

        if (fromEntity.id === toEntity.id) continue;

        if (!isObjectEntity(fromEntity) || !isObjectEntity(toEntity)) {
            continue;
        }

        mermaid += `${fromEntity.name} --> ${toEntity.name}\n`;
    }

    return `${mermaid}\`\`\`\n`;
}

function isObjectEntity(entity: DlangEntity | undefined): entity is DlangObject {
    return entity?.kind === "object";
}

function isFunctionEntity(entity: DlangEntity | undefined): entity is DlangFunction {
    return entity?.kind === "function";
}

function findCyclicEdgeIds(graphBuilder: GraphBuilder): Array<{ from: string; to: string }> {
    const adjacency = new Map<string, string[]>();

    for (const node of graphBuilder.nodes) {
        adjacency.set(node, []);
    }

    for (const edge of graphBuilder.edges) {
        adjacency.get(edge.from)?.push(edge.to);
    }

    const visited = new Set<string>();
    const activePath = new Set<string>();
    const currentPath: string[] = [];
    const cyclicEdges = new Set<string>();

    const visit = (node: string): void => {
        visited.add(node);
        activePath.add(node);
        currentPath.push(node);

        for (const neighbor of adjacency.get(node) ?? []) {
            const edgeKey = `${node}:${neighbor}`;

            if (activePath.has(neighbor)) {
                const cycleStartIndex = currentPath.indexOf(neighbor);

                for (let i = cycleStartIndex; i < currentPath.length - 1; i += 1) {
                    const from = currentPath[i];
                    const to = currentPath[i + 1];
                    cyclicEdges.add(`${from}:${to}`);
                }

                cyclicEdges.add(edgeKey);
                continue;
            }

            if (!visited.has(neighbor)) {
                visit(neighbor);
            }
        }

        currentPath.pop();
        activePath.delete(node);
    };

    for (const node of graphBuilder.nodes) {
        if (!visited.has(node)) {
            visit(node);
        }
    }

    return [...cyclicEdges].map(edgeId => {
        const [from, to] = edgeId.split(':');
        return { from, to };
    });
}

function getDependencyRelation(kind: DlangEdgeKind): string {
    switch (kind) {
        case "owns":
            return '-->|"owns"|';

        case "references":
            return '-->|"references"|';

        case "dependsOn":
            return '-->|"depends on"|';

        default:
            return "---";
    }
}
