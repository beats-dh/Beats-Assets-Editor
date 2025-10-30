local mType = Game.createMonsterType("Orc Cult Inquisitor")
local monster = {}

monster.description = "an orc cult inquisitor"
monster.experience = 1150
monster.outfit = {
	lookType = 8,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1505
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Edron Orc Cave.",
}

monster.health = 1500
monster.maxHealth = 1500
monster.race = "blood"
monster.corpse = 5980
monster.speed = 125
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
	{ text = "You unorcish scum will die!", yell = false },
}

monster.loot = {
	{ name = "strong health potion", chance = 14712 },
	{ name = "gold coin", chance = 80000, maxCount = 221 },
	{ name = "black pearl", chance = 408, maxCount = 2 },
	{ name = "berserk potion", chance = 2352 },
	{ name = "small ruby", chance = 3216, maxCount = 5 },
	{ name = "battle axe", chance = 5072 },
	{ name = "bug meat", chance = 13728 },
	{ name = "red mushroom", chance = 6184, maxCount = 3 },
	{ name = "halberd", chance = 7912 },
	{ name = "orcish axe", chance = 680 },
	{ name = "cultish robe", chance = 7912 },
	{ name = "ham", chance = 7168 },
	{ name = "orc tooth", chance = 4328 },
	{ name = "orcish gear", chance = 12368 },
	{ name = "orc leather", chance = 6184 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -500 },
}

monster.defenses = {
	defense = 40,
	armor = 40,
	mitigation = 1.46,
	{ name = "speed", interval = 2000, chance = 30, speedChange = 290, effect = CONST_ME_MAGIC_RED, target = false, duration = 6000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
