local mType = Game.createMonsterType("Blight Mariner")
local monster = {}

monster.description = "Blight Mariner"
monster.experience = 25500
monster.outfit = { lookType = 1221, lookHead = 57, lookBody = 9, lookLegs = 90, lookFeet = 57, lookAddons = 3, lookMount = 0 }

monster.health = 16500
monster.maxHealth = 16500
monster.race = "undead"
monster.corpse = 31599
monster.speed = 120
monster.manaCost = 0

monster.events = {}

monster.changeTarget = { interval = 4000, chance = 10 }

monster.bosstiary = {
    bossRaceId = 2682,
	bossRace = RARITY_BANE,
}

monster.events = {
	"BetweenTheLinesMiniBossFirstKillRewards"
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
	{ name = "platinum coin", minCount = 1, maxCount = 69, chance = 50000 },
	{ name = "proficiency catalyst", chance = 2000 },
	{ name = "etcher", chance = 12000 },
	{ name = "black pearl", minCount = 1, maxCount = 2, chance = 8000 },
	{ name = "white pearl", minCount = 1, maxCount = 2, chance = 8000 },
	{ name = "cyan crystal fragment", minCount = 1, maxCount = 2, chance = 7000 },
	{ name = "moonstone", minCount = 1, maxCount = 2, chance = 6500 },
	{ name = "onyx chip", minCount = 1, maxCount = 4, chance = 6000 },
	{ name = "small topaz", minCount = 1, maxCount = 7, chance = 6000 },
	{ name = "terra boots", minCount = 1, maxCount = 2, chance = 5000 },
	{ name = "two handed sword", minCount = 1, maxCount = 2, chance = 5000 },
	{ name = "stone skin amulet", chance = 5000 },
	{ name = "strange helmet", chance = 4000 },
	{ name = "gold ingot", chance = 4000 },
	{ name = "dark armor", chance = 4000 },
	{ name = "crystalline armor", chance = 3000 },
	{ name = "mercenary sword", chance = 3000 },
	{ name = "terra legs", chance = 3000 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -350, maxDamage = -650, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", interval = 2500, chance = 25, type = COMBAT_ICEDAMAGE, minDamage = -300, maxDamage = -600, range = 6, shootEffect = CONST_ANI_ICE, effect = CONST_ME_ICEATTACK, target = true },
	{ name = "combat", interval = 2600, chance = 22, type = COMBAT_DEATHDAMAGE, minDamage = -300, maxDamage = -600, length = 7, spread = 3, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2800, chance = 18, type = COMBAT_DROWNDAMAGE, minDamage = -350, maxDamage = -650, length = 8, spread = 0, effect = CONST_ME_WATERSPLASH, target = false },
}

monster.defenses = { defense = 28, armor = 50 }

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
