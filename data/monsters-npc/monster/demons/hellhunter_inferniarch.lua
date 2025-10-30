local mType = Game.createMonsterType("Hellhunter Inferniarch")
local monster = {}

monster.description = "a hellhunter inferniarch"
monster.experience = 8100
monster.outfit = {
	lookType = 1793,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2600
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Castle Catacombs.",
}

monster.health = 11300
monster.maxHealth = 11300
monster.race = "fire"
monster.corpse = 49994
monster.speed = 175
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
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
	rewardBoss = false,
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
	{ text = "Ardash... El...!", "Urrrglll!", yell = false },
}

monster.loot = {
	{ id = 3035, chance = 80000, maxCount = 35 }, -- platinum coin
	{ id = 7365, chance = 8112, maxCount = 5 }, -- onyx arrow
	{ id = 7368, chance = 6760, maxCount = 10 }, -- assassin star
	{ id = 3033, chance = 5816, maxCount = 4 }, -- small amethyst
	{ id = 16125, chance = 3328, maxCount = 1 }, -- cyan crystal Fragment
	{ id = 49909, chance = 2320, maxCount = 1 }, -- demonic core essence
	{ id = 7364, chance = 2104, maxCount = 5 }, -- sniper arrow
	{ id = 3384, chance = 1480, maxCount = 1 }, -- dark helmet
	{ id = 49908, chance = 856, maxCount = 1 }, -- mummified demon finger
	{ id = 6299, chance = 776, maxCount = 1 }, -- death ring
	{ id = 49894, chance = 576, maxCount = 1 }, -- demonic matter
	{ id = 50055, chance = 408, maxCount = 1 }, -- hellhunter eye
	{ id = 8850, chance = 40, maxCount = 1 }, -- composite hornbow
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 200, maxDamage = -669, condition = { type = CONDITION_FIRE, totalDamage = 600, interval = 9000 } },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = -460, maxDamage = -600, range = 7, shootEffect = CONST_ANI_INFERNALBOLT, target = true },
	{ name = "combat", interval = 2000, chance = 17, type = COMBAT_ENERGYDAMAGE, minDamage = -380, maxDamage = -520, radius = 4, effect = CONST_ME_YELLOWENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_ENERGYDAMAGE, minDamage = -220, maxDamage = -400, range = 7, shootEffect = CONST_ANI_ENERGY, radius = 3, effect = CONST_ME_ENERGYHIT, target = true },
	{ name = "energyfield", interval = 2000, chance = 17, range = 7, radius = 1, shootEffect = CONST_ANI_ENERGY, target = true },
	{ name = "inferniarch white chain", interval = 2500, chance = 18, minDamage = -258, maxDamage = -450, range = 8 },
	{ name = "combat", interval = 2000, chance = 16, type = COMBAT_DEATHDAMAGE, minDamage = -200, maxDamage = -550, range = 7, shootEffect = CONST_ANI_ONYXARROW, effect = CONST_ME_MORTAREA, target = true },
}

monster.defenses = {
	defense = 20,
	armor = 73,
	mitigation = 2.20,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 200, maxDamage = 300, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -15 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
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
