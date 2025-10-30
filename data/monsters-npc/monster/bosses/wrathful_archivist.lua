local mType = Game.createMonsterType("Wrathful Archivist")
local monster = {}

monster.description = "Wrathful Archivist"
monster.experience = 15000
monster.outfit = { lookType = 194, lookHead = 90, lookBody = 116, lookLegs = 90, lookFeet = 57, lookAddons = 3, lookMount = 0 }

monster.health = 24000
monster.maxHealth = 24000
monster.race = "undead"
monster.corpse = 6068
monster.speed = 125
monster.manaCost = 0

monster.events = {
	"BetweenTheLinesMiniBossFirstKillRewards"
}

monster.changeTarget = { interval = 4000, chance = 10 }

monster.bosstiary = {
    bossRaceId = 2681,
	bossRace = RARITY_BANE,
}

monster.strategiesTarget = { nearest = 100 }

monster.flags = {
	summonable = false, attackable = true, hostile = true, convinceable = false, pushable = false, rewardBoss = true,
	illusionable = false, canPushItems = true, canPushCreatures = true, staticAttackChance = 90, targetDistance = 1,
	runHealth = 0, healthHidden = false, isBlockable = false, canWalkOnEnergy = true, canWalkOnFire = true, canWalkOnPoison = true,
}

monster.light = { level = 0, color = 0 }

monster.voices = { interval = 5000, chance = 10 }

monster.loot = {
	{ name = "gold coin", minCount = 1, maxCount = 2, chance = 20000 },
	{ name = "platinum coin", minCount = 10, maxCount = 69, chance = 50000 },
	{ name = "mana potion", minCount = 1, maxCount = 14, chance = 20000 },
	{ name = "strong mana potion", minCount = 1, maxCount = 10, chance = 20000 },
	{ name = "great mana potion", minCount = 1, maxCount = 5, chance = 18000 },
	{ name = "ultimate mana potion", chance = 15000 },
	{ id = 3063, chance = 5000 }, -- time ring	
	{ id = 3092, chance = 5000 }, -- axe ring	
	{ id = 6299, chance = 5000 }, -- axe ring
	{ name = "small sapphire", minCount = 1, maxCount = 3, chance = 9000 },
	{ name = "small emerald", minCount = 1, maxCount = 3, chance = 9000 },
	{ name = "small ruby", minCount = 1, maxCount = 3, chance = 9000 },
	{ name = "small amethyst", minCount = 1, maxCount = 3, chance = 9000 },
	{ name = "blue gem", chance = 7000 },
	{ name = "violet gem", chance = 7000 },
	{ name = "blue crystal splinter", minCount = 1, maxCount = 2, chance = 6000 },
	{ name = "blue crystal shard", chance = 5000 },
	{ name = "violet crystal shard", minCount = 1, maxCount = 2, chance = 5000 },
	{ name = "terra amulet", minCount = 1, maxCount = 2, chance = 4000 },
	{ name = "magma amulet", chance = 4000 },
	{ name = "lightning pendant", chance = 4000 },
	{ name = "wand of inferno", minCount = 1, maxCount = 2, chance = 3500 },
	{ name = "wand of cosmic energy", chance = 3500 },
	{ name = "spellbook of mind control", chance = 2500 },
	{ name = "spellweaver's robe", chance = 2000 },
	{ name = "blank imbuement scroll", chance = 3000 },
	{ name = "proficiency catalyst", chance = 2000 },
	{ name = "sand-filled horn", chance = 500 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -350, maxDamage = -650, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", interval = 2500, chance = 25, type = COMBAT_FIREDAMAGE, minDamage = -300, maxDamage = -600, range = 6, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "combat", interval = 2600, chance = 22, type = COMBAT_HOLYDAMAGE, minDamage = -300, maxDamage = -600, length = 7, spread = 3, effect = CONST_ME_HOLYDAMAGE, target = false },
	{ name = "combat", interval = 2800, chance = 18, type = COMBAT_DEATHDAMAGE, minDamage = -350, maxDamage = -650, length = 8, spread = 0, effect = CONST_ME_MORTAREA, target = false },
}

monster.defenses = { defense = 30, armor = 55 }

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 }, { type = COMBAT_ENERGYDAMAGE, percent = 0 }, { type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 }, { type = COMBAT_ICEDAMAGE, percent = 0 }, { type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 }, { type = COMBAT_LIFEDRAIN, percent = 0 }, { type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true }, { type = "outfit", condition = false }, { type = "invisible", condition = true }, { type = "bleed", condition = false },
}

mType:register(monster)
