// src/npcTypes.ts

export interface NpcShopItem {
    itemName?: string | null;
    clientId?: number | null;
    itemId?: number | null;
    buy?: number | null;
    sell?: number | null;
    count?: number | null;
}

export interface NpcVoice {
    text: string;
    yell: boolean;
}

export interface NpcVoices {
    interval: number;
    chance: number;
    lines: NpcVoice[];
}

export interface NpcOutfit {
    lookType: number;
    lookHead: number;
    lookBody: number;
    lookLegs: number;
    lookFeet: number;
    lookAddons: number;
    lookMount: number;
}

export interface NpcFlags {
    floorchange: boolean;
}

export interface NpcMeta {
    missingFields: string[];
    touchedFields: string[];
}

export interface NpcKeyword {
    words: string[];
    response: string;
}

export interface NpcInteractions {
    messages: Record<string, string>;
    keywords: NpcKeyword[];
    modules: string[];
    rawCode: string;
}

export interface Npc {
    name: string;
    description: string;
    health: number;
    maxHealth: number;
    walkInterval: number;
    walkRadius: number;
    outfit: NpcOutfit;
    flags: NpcFlags;

    amountLevel?: number | null;
    amountMoney?: number | null;
    currency?: number | null;
    maxLevel?: number | null;
    moneyToNeedDonation?: number | null;
    respawnType?: string | null;

    voices?: NpcVoices | null;
    shop?: NpcShopItem[] | null;

    interactions?: NpcInteractions | null;

    meta: NpcMeta;
}

export interface NpcListEntry {
    name: string;
    filePath: string;
    relativePath: string;
    categories: string[];
}
