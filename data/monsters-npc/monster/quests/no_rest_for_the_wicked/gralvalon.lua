local mType = Game.createMonsterType("Gralvalon")
local monster = {}

monster.description = "Gralvalon"
monster.experience = 24000
monster.outfit = {
	lookType = 1793,
	lookAddons = 1,
}

monster.bosstiary = {
	bossRaceId = 2606,
	bossRace = RARITY_BANE,
}

monster.health = 33000
monster.maxHealth = 33000
monster.race = "fire"
monster.corpse = 50046
monster.speed = 200
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 20,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 10,
	damage = 10,
	random = 10,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 3,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{id = 49894, chance = 70000}, -- demonic matter
	{id = 3035, chance = 70000, maxCount = 30},
	{id = 49909, chance = 6481}, -- demonic core essence
	{id = 16125, chance = 3889}, -- cyan crystal fragment
	{id = 32769, chance = 2593}, -- white gem
	{id = 7364, chance = 1945, maxCount = 10}, -- sniper arrow
	{id = 7365, chance = 1296, maxCount = 4}, -- onyx arrow
	{id = 49892, chance = 648}, -- skin of Gralvalon
	{id = 7368, chance = 648, maxCount = 12}, -- assassin star
	{id = 3384, chance = 648}, -- dark helmet
	{id = 6299, chance = 648}, -- death ring
	{id = 22194, chance = 648}, -- opal
	{id = 3033, chance = 648, maxCount = 2} -- smal amethyst

}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 200, maxDamage = -669, condition = { type = CONDITION_FIRE, totalDamage = 600, interval = 9000 } },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = -650, maxDamage = -950, range = 7, shootEffect = CONST_ANI_INFERNALBOLT, target = true },
	{ name = "combat", interval = 2000, chance = 17, type = COMBAT_ENERGYDAMAGE, minDamage = -650, maxDamage = -1000, radius = 4, effect = CONST_ME_YELLOWENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_ENERGYDAMAGE, minDamage = -650, maxDamage = -900, range = 7, shootEffect = CONST_ANI_ENERGY, radius = 3, effect = CONST_ME_ENERGYHIT, target = true },
	{ name = "energyfield", interval = 2000, chance = 17, range = 7, radius = 1, shootEffect = CONST_ANI_ENERGY, target = true },
	{ name = "inferniarch white chain", interval = 2500, chance = 18, minDamage = -500, maxDamage = -800, range = 8 },
	{ name = "combat", interval = 2000, chance = 16, type = COMBAT_DEATHDAMAGE, minDamage = -500, maxDamage = -850, range = 7, shootEffect = CONST_ANI_ONYXARROW, effect = CONST_ME_MORTAREA, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 45,
	mitigation = 1.50,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -15 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
