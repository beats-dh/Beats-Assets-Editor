local mType = Game.createMonsterType("Tropical Desolator")
local monster = {}

monster.description = "Tropical Desolator"
monster.experience = 23000
monster.outfit = { lookType = 1589, lookHead = 0, lookBody = 0, lookLegs = 0, lookFeet = 0, lookAddons = 3, lookMount = 0 }

monster.health = 20500
monster.maxHealth = 20500
monster.race = "undead"
monster.corpse = 6068
monster.speed = 120
monster.manaCost = 0

monster.events = {
	"BetweenTheLinesMiniBossFirstKillRewards"
}

monster.changeTarget = { interval = 4000, chance = 10 }

monster.bosstiary = {
    bossRaceId = 2683,
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
	{ name = "platinum coin", minCount = 1, maxCount = 87, chance = 50000 },
	{ name = "mango", minCount = 1, maxCount = 3, chance = 16000 },
	{ name = "pineapple", minCount = 1, maxCount = 2, chance = 15000 },
	{ name = "melon", minCount = 1, maxCount = 4, chance = 15000 },
	{ name = "banana", minCount = 1, maxCount = 3, chance = 15000 },
	{ name = "coconut", minCount = 1, maxCount = 3, chance = 15000 },
	{ name = "black pearl", minCount = 1, maxCount = 2, chance = 12000 },
	{ name = "white pearl", minCount = 1, maxCount = 5, chance = 12000 },
	{ name = "green gem", chance = 9000 },
	{ id = 282, chance = 5000 }, -- giant shimmering pearl
	{ name = "green crystal shard", minCount = 1, maxCount = 2, chance = 9000 },
	{ name = "opal", minCount = 1, maxCount = 3, chance = 9000 },
	{ name = "rainbow quartz", minCount = 1, maxCount = 3, chance = 9000 },
	{ name = "proficiency catalyst", chance = 2500 },
	{ name = "etcher", chance = 5000 },
	{ name = "scallop shell", chance = 800 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -350, maxDamage = -650, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", interval = 2500, chance = 25, type = COMBAT_FIREDAMAGE, minDamage = -300, maxDamage = -600, range = 6, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "combat", interval = 2600, chance = 22, type = COMBAT_EARTHDAMAGE, minDamage = -300, maxDamage = -600, length = 7, spread = 3, effect = CONST_ME_GREEN_RINGS, target = false },
	{ name = "combat", interval = 2800, chance = 18, type = COMBAT_ENERGYDAMAGE, minDamage = -350, maxDamage = -650, length = 8, spread = 0, effect = CONST_ME_ENERGYHIT, target = false },
}

monster.defenses = { defense = 28, armor = 52 }

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
