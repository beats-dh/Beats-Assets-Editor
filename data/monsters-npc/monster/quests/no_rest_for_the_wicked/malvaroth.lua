local mType = Game.createMonsterType("Malvaroth")
local monster = {}

monster.description = "Malvaroth"
monster.experience = 28000
monster.outfit = {
	lookType = 1794,
	lookAddons = 1,
}

monster.bosstiary = {
	bossRaceId = 2607,
	bossRace = RARITY_BANE,
}

monster.health = 40000
monster.maxHealth = 40000
monster.race = "fire"
monster.corpse = 50050
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
	staticAttackChance = 95,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
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
	{ text = "Tar ... Zhun ...!", yell = false },
}

monster.loot = {
    {id = 50056, chance = 70000}, -- brinebrute claw
	{id = 49894, chance = 70000}, -- demonic matter
	{id = 3035, chance = 70000, maxCount = 50}, -- platinum coin
    {id = 49909, chance = 9333}, -- demonic core essence
    {id = 7642, chance = 9333, maxCount = 5}, -- great spirit potion
    {id = 16124, chance = 5833}, -- blue crystal splinter
    {id = 16122, chance = 4667}, -- green crystal splinter
    {id = 16121, chance = 3500, maxCount = 2}, -- green crystal shard
    {id = 16119, chance = 2333, maxCount = 2}, -- blue crystal shard
    {id = 16123, chance = 2333}, -- brown crystal splinter
    {id = 16120, chance = 2333, maxCount = 2}, -- violet crystal shard
    {id = 49893, chance = 1312}, -- skin of Malvaroth
    {id = 9058, chance = 1167}, -- gold ingot
    {id = 3048, chance = 1167}, -- might ring
    {id = 3081, chance = 1167}, -- stone skin amulet
    {id = 7643, chance = 1167, maxCount = 4} -- ultimate health potion

}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 300, maxDamage = -920 },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_DEATHDAMAGE, minDamage = -650, maxDamage = -1000, effect = CONST_ME_SMALLCLOUDS, target = true },
	{ name = "combat", interval = 2500, chance = 16, type = COMBAT_AGONYDAMAGE, minDamage = -650, maxDamage = -850, effect = CONST_ME_REAPERSTRIKE, target = true },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_DEATHDAMAGE, minDamage = -500, maxDamage = -900, length = 7, spread = 0, effect = CONST_ME_EXPLOSIONHIT, target = false },
	{ name = "combat", interval = 3000, chance = 20, type = COMBAT_ENERGYDAMAGE, minDamage = -600, maxDamage = -950, radius = 4, effect = CONST_ME_SLASH, target = false },
}

monster.defenses = {
	defense = 55,
	armor = 45,
	mitigation = 1.50,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
