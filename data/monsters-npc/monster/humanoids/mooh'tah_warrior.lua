local mType = Game.createMonsterType("Mooh'Tah Warrior")
local monster = {}

monster.description = "a mooh'tah warrior"
monster.experience = 900
monster.outfit = {
	lookType = 611,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1051
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Oramond/Southern Plains, Minotaur Hills, \z
		Oramond Dungeon (depending on Magistrate votes), Underground Glooth Factory.",
}

monster.health = 1200
monster.maxHealth = 1200
monster.race = "blood"
monster.corpse = 21091
monster.speed = 110
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
	chance = 4,
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
	canPushCreatures = true,
	staticAttackChance = 90,
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
	{ text = "Feel the power of the Mooh'Tah!", yell = false },
	{ text = "Ommm!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 80000, maxCount = 119 },
	{ name = "platinum coin", chance = 36360, maxCount = 3 },
	{ id = 21202, chance = 15176 }, -- mooh'tah shell
	{ name = "strong mana potion", chance = 7432 },
	{ name = "strong health potion", chance = 6800 },
	{ name = "small ruby", chance = 6168 },
	{ name = "small emerald", chance = 5056 },
	{ name = "small amethyst", chance = 4272 },
	{ name = "minotaur leather", chance = 4272 },
	{ name = "minotaur horn", chance = 3640, maxCount = 2 },
	{ name = "small topaz", chance = 3480 },
	{ id = 3094, chance = 1264 }, -- sword ring
	{ name = "cowtana", chance = 1104 },
	{ id = 21166, chance = 1104 }, -- mooh'tah plate
	{ name = "knight armor", chance = 792 },
	{ name = "red piece of cloth", chance = 632 },
	{ name = "knight legs", chance = 472 },
	{ name = "guardian shield", chance = 472 },
	{ id = 7401, chance = 128 }, -- minotaur trophy
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 45, attack = 80 },
	{ name = "combat", interval = 2000, chance = 14, type = COMBAT_ENERGYDAMAGE, minDamage = -150, maxDamage = -200, length = 4, spread = 0, effect = CONST_ME_YELLOWENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 11, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -135, range = 7, shootEffect = CONST_ANI_LARGEROCK, effect = CONST_ME_EXPLOSIONAREA, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_LIFEDRAIN, minDamage = -50, maxDamage = -150, radius = 3, effect = CONST_ME_HITAREA, target = false },
	{ name = "mooh'tah master skill reducer", interval = 2000, chance = 19, range = 7, target = false },
}

monster.defenses = {
	defense = 37,
	armor = 37,
	mitigation = 1.35,
	{ name = "combat", interval = 2000, chance = 22, type = COMBAT_HEALING, minDamage = 110, maxDamage = 160, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "haste", interval = 2000, chance = 8, speedChange = 220, effect = CONST_ME_MAGIC_RED, target = false, duration = 1000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 10 },
	{ type = COMBAT_FIREDAMAGE, percent = 15 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
