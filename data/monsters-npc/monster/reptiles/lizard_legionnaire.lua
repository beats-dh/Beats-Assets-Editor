local mType = Game.createMonsterType("Lizard Legionnaire")
local monster = {}

monster.description = "a lizard legionnaire"
monster.experience = 1100
monster.outfit = {
	lookType = 338,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 624
monster.Bestiary = {
	class = "Reptile",
	race = BESTY_RACE_REPTILE,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Zzaion, Zao Palace and its antechambers, Muggy Plains, Zao Orc Land (in fort), \z
		Corruption Hole, Razachai, Temple of Equilibrium, Northern Zao Plantations.",
}

monster.health = 1400
monster.maxHealth = 1400
monster.race = "blood"
monster.corpse = 10359
monster.speed = 133
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 100,
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
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 4,
	runHealth = 10,
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
	{ text = "Tssss!", yell = false },
}

monster.loot = {
	{ name = "small diamond", chance = 801, maxCount = 2 },
	{ name = "gold coin", chance = 35200, maxCount = 100 },
	{ name = "gold coin", chance = 43200, maxCount = 65 },
	{ name = "lizard leather", chance = 776 },
	{ name = "lizard scale", chance = 784, maxCount = 3 },
	{ name = "strong health potion", chance = 3104 },
	{ name = "red lantern", chance = 424 },
	{ name = "bunch of ripe rice", chance = 1560 },
	{ name = "zaoan armor", chance = 56 },
	{ name = "zaoan shoes", chance = 368 },
	{ name = "drakinata", chance = 568 },
	{ name = "zaoan halberd", chance = 768 },
	{ name = "legionnaire flags", chance = 1552 },
	{ name = "broken halberd", chance = 11952 },
	{ name = "lizard trophy", chance = 16 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -180 },
	{ name = "combat", interval = 2000, chance = 40, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -200, range = 7, shootEffect = CONST_ANI_SPEAR, target = true },
}

monster.defenses = {
	defense = 25,
	armor = 30,
	mitigation = 1.07,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 45 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
