// Schema, enums and field metadata for the structured spell editors.
// Enum values are taken from the real Tibia 15.x spells.json / spells-previews.json.

// ---- enums (real values) ---------------------------------------------------

export const SPELL_GROUP_PRIMARY = ["SPELLGROUP_ATTACK", "SPELLGROUP_HEALING", "SPELLGROUP_SUPPORT"] as const;

export const SPELL_GROUP_SECONDARY = [
    "SPELLGROUP_NONE",
    "SPELLGROUP_BURSTS_OF_NATURE",
    "SPELLGROUP_CRIPPLING",
    "SPELLGROUP_FOCUS",
    "SPELLGROUP_GREATBEAMS",
    "SPELLGROUP_POWERSTRIKES",
    "SPELLGROUP_ULTIMATESTRIKES",
    "SPELLGROUP_VIRTUE",
] as const;

export const DAMAGE_TYPES = [
    "DAMAGE_HEALING",
    "DAMAGE_HIT",
    "DAMAGE_FIRE",
    "DAMAGE_FIRE_DOT",
    "DAMAGE_ICE",
    "DAMAGE_ENERGY",
    "DAMAGE_ENERGY_DOT",
    "DAMAGE_EARTH",
    "DAMAGE_EARTH_DOT",
    "DAMAGE_DEATH",
    "DAMAGE_DEATH_DOT",
    "DAMAGE_HOLY",
    "DAMAGE_HOLY_DOT",
] as const;

export const VOCATIONS = ["Knight", "Paladin", "Sorcerer", "Druid", "Monk"] as const;

export const SCALING = ["magiclevel", "distanceskill", "fistskill", "weapon", "weaponskills"] as const;

export const SOURCES = ["", "threefoldpath", "wheelofdestiny"] as const;

export const ACTION_TYPES = ["fieldEffect", "missile", "objecttype", "target", "clearField"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

/** Which numeric id field each action type carries (target has none). */
export const ACTION_ID_FIELD: Record<ActionType, string | null> = {
    fieldEffect: "effectID",
    missile: "missileID",
    objecttype: "objecttypeID",
    clearField: "objecttypeID",
    target: null,
};

// ---- record types ----------------------------------------------------------

/** A spells.json entry. Known fields are typed; anything else is preserved. */
export interface Spell {
    spellid: number;
    name: string;
    formulaWithoutParams?: string;
    parameterHints?: string | null;
    spellGroupPrimary?: string;
    spellGroupSecondary?: string;
    iconIndex?: number;
    goldPrice?: number;
    isRune?: boolean;
    isRuneCreatable?: boolean;
    minimumCasterLevel?: number;
    premium?: boolean;
    aggressive?: boolean;
    allowedVocations?: string[];
    castCostMana?: number;
    castCostSoulPoints?: number;
    cooldownSelf?: number;
    cooldownPrimaryGroup?: number;
    cooldownSecondaryGroup?: number;
    description?: string;
    cities?: string[];
    source?: string;
    scaling?: string[];
    runeParams?: unknown;
    mean?: number;
    damagetype?: string;
    // Preserve any unknown keys round-trip.
    [key: string]: unknown;
}

export interface FxAction {
    action: ActionType | string;
    x: number;
    y: number;
    effectID?: number;
    missileID?: number;
    objecttypeID?: number;
    [key: string]: unknown;
}

export interface FxTimestamp {
    timestamp: number;
    actions: FxAction[];
}

export interface SpellPreview {
    spellid: number;
    name: string;
    range?: number;
    timestamps: FxTimestamp[];
    initActions: FxAction[];
    [key: string]: unknown;
}

// ---- field metadata for generating widgets ---------------------------------

export type FieldKind = "number" | "text" | "textarea" | "bool" | "enum" | "list";

export interface FieldSpec {
    key: keyof Spell & string;
    label: string;
    kind: FieldKind;
    /** For enum fields: the allowed values. */
    options?: readonly string[];
    /** For list fields: suggested values (chips). */
    suggestions?: readonly string[];
}

/** The full spells.json field set, each with a dedicated widget kind. */
export const SPELL_FIELDS: FieldSpec[] = [
    { key: "spellid", label: "Spell ID", kind: "number" },
    { key: "name", label: "Name", kind: "text" },
    { key: "formulaWithoutParams", label: "Formula", kind: "text" },
    { key: "parameterHints", label: "Parameter hints", kind: "text" },
    { key: "spellGroupPrimary", label: "Group (primary)", kind: "enum", options: SPELL_GROUP_PRIMARY },
    { key: "spellGroupSecondary", label: "Group (secondary)", kind: "enum", options: SPELL_GROUP_SECONDARY },
    { key: "damagetype", label: "Damage type", kind: "enum", options: DAMAGE_TYPES },
    { key: "iconIndex", label: "Icon index", kind: "number" },
    { key: "goldPrice", label: "Gold price", kind: "number" },
    { key: "minimumCasterLevel", label: "Min. level", kind: "number" },
    { key: "castCostMana", label: "Mana cost", kind: "number" },
    { key: "castCostSoulPoints", label: "Soul cost", kind: "number" },
    { key: "cooldownSelf", label: "Cooldown (self)", kind: "number" },
    { key: "cooldownPrimaryGroup", label: "Cooldown (primary)", kind: "number" },
    { key: "cooldownSecondaryGroup", label: "Cooldown (secondary)", kind: "number" },
    { key: "mean", label: "Mean", kind: "number" },
    { key: "isRune", label: "Is rune", kind: "bool" },
    { key: "isRuneCreatable", label: "Rune creatable", kind: "bool" },
    { key: "premium", label: "Premium", kind: "bool" },
    { key: "aggressive", label: "Aggressive", kind: "bool" },
    { key: "source", label: "Source", kind: "enum", options: SOURCES },
    { key: "allowedVocations", label: "Vocations", kind: "list", suggestions: VOCATIONS },
    { key: "scaling", label: "Scaling", kind: "list", suggestions: SCALING },
    { key: "cities", label: "Cities", kind: "list" },
    { key: "description", label: "Description", kind: "textarea" },
];

/** Create a new blank spell with sensible defaults. */
export function blankSpell(spellid: number): Spell {
    return {
        spellid,
        name: `New Spell ${spellid}`,
        formulaWithoutParams: "",
        spellGroupPrimary: "SPELLGROUP_ATTACK",
        spellGroupSecondary: "SPELLGROUP_NONE",
        iconIndex: 0,
        goldPrice: 0,
        isRune: false,
        isRuneCreatable: false,
        minimumCasterLevel: 0,
        premium: false,
        aggressive: false,
        allowedVocations: [],
        castCostMana: 0,
        castCostSoulPoints: 0,
        cooldownSelf: 0,
        cooldownPrimaryGroup: 0,
        cooldownSecondaryGroup: 0,
        description: "",
        cities: [],
        source: "",
        scaling: [],
        runeParams: null,
        mean: 0,
        damagetype: "DAMAGE_HIT",
    };
}

/** Create a new blank preview keyed to a spellid. */
export function blankPreview(spellid: number, name = `New Spell ${spellid}`): SpellPreview {
    return { spellid, range: 0, name, timestamps: [], initActions: [] };
}

/** Build a default action object for the given type. */
export function blankAction(type: ActionType): FxAction {
    const base: FxAction = { action: type, x: 0, y: 0 };
    const idField = ACTION_ID_FIELD[type];
    if (idField) base[idField] = 0;
    return base;
}
