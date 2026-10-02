import type { NpcListEntry } from '../../../npcTypes';

export type NpcCategoryNode = {
    name: string;
    path: string;
    children: Map<string, NpcCategoryNode>;
    npcs: NpcListEntry[];
};

export const UNKNOWN_CLASS_NAME = "Unknown";

export const CATEGORY_ICON_MAP: Record<string, string> = {
    // Common themes based on filename/category folders if they exist
    merchant: "💰", merchants: "💰", guard: "🛡️", guards: "🛡️",
    citizen: "🧑", citizens: "🧑", guide: "🗺️", guides: "🗺️",
    banker: "🏦", bankers: "🏦", unknown: "❔",
};

export function getCategoryIcon(categoryName: string): string {
    const normalized = categoryName.toLowerCase().replace(/\s+/g, "_");
    return CATEGORY_ICON_MAP[normalized] ?? "❔";
}

export function buildNpcTree(entries: NpcListEntry[]): NpcCategoryNode {
    const root: NpcCategoryNode = {
        name: "__root__",
        path: "",
        children: new Map(),
        npcs: [],
    };

    entries.forEach((entry) => {
        // If NPCs don't have categories derived from files, we chunk them alphabetically or by path folder
        // By default, if Categories is empty, we derive it from RelativePath

        let categories = Array.isArray(entry.categories) ? [...entry.categories] : [];

        // Auto-categorize based on sub-folders from the root path
        if (categories.length === 0 && entry.relativePath) {
            let parts = entry.relativePath.split('/');
            parts.pop(); // Remove the filename
            if (parts.length > 0) {
                categories = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1));
            } else {
                categories = ["Geral"];
            }
        } else if (categories.length === 0) {
            categories = ["Geral"];
        }

        let cursor = root;
        categories.forEach((category) => {
            if (!cursor.children.has(category)) {
                const nextPath = cursor.path ? `${cursor.path}/${category}` : category;
                cursor.children.set(category, {
                    name: category,
                    path: nextPath,
                    children: new Map(),
                    npcs: [],
                });
            }
            cursor = cursor.children.get(category)!;
        });
        cursor.npcs.push(entry);
    });

    return root;
}

export function countNpcsInNode(node: NpcCategoryNode): number {
    let total = node.npcs.length;
    node.children.forEach((child) => {
        total += countNpcsInNode(child);
    });
    return total;
}

export function sortCategoryNodes(nodes: NpcCategoryNode[]): NpcCategoryNode[] {
    if (nodes.length === 0) return nodes;

    return nodes.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}
