local mType = Game.createMonsterType("Worm Priestess")
local monster = {}

monster.description = "a worm priestess"
monster.experience = 1500
monster.outfit = {
	lookType = 613,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1053
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
		Oramond Dungeon (depending on Magistrate votes), Underground Glooth Factory, Oramond Fury Dungeon.",
}

monster.health = 1100
monster.maxHealth = 1100
monster.race = "blood"
monster.corpse = 21099
monster.speed = 99
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
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 4,
	runHealth = 200,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = false,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "An enemy of the worm shall become his food!", yell = false },
	{ text = "The great worm will swallow you!", yell = false },
	{ text = "From the earthy depths he comes and brings freedom!", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 80000, maxCount = 150 }, -- gold coin
	{ id = 3035, chance = 32904, maxCount = 3 }, -- platinum coin
	{ id = 11473, chance = 12680 }, -- purple robe
	{ id = 237, chance = 9904, maxCount = 3 }, -- strong mana potion
	{ id = 3066, chance = 9176 }, -- snakebite rod
	{ id = 7425, chance = 4168 }, -- taurus mace
	{ id = 2920, chance = 3808 }, -- torch
	{ id = 5878, chance = 3712 }, -- minotaur leather
	{ id = 11472, chance = 2352, maxCount = 2 }, -- minotaur horn
	{ id = 3033, chance = 2000, maxCount = 2 }, -- small amethyst
	{ id = 3032, chance = 1896, maxCount = 2 }, -- small emerald
	{ id = 3030, chance = 1760, maxCount = 2 }, -- small ruby
	{ id = 9057, chance = 1968, maxCount = 2 }, -- small topaz
	{ id = 3028, chance = 1944, maxCount = 2 }, -- small diamond
	{ id = 5911, chance = 1080 }, -- red piece of cloth
	{ id = 5910, chance = 1120 }, -- green piece of cloth
	{ id = 5912, chance = 1456 }, -- blue piece of cloth
	{ id = 8082, chance = 1272 }, -- underworld rod
	{ id = 3037, chance = 448 }, -- yellow gem
	{ id = 3039, chance = 344 }, -- red gem
	{ id = 7401, chance = 128 }, -- minotaur trophy
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 50, attack = 50 },
	{ name = "combat", interval = 2000, chance = 24, type = COMBAT_LIFEDRAIN, minDamage = -50, maxDamage = -130, range = 7, shootEffect = CONST_ANI_SMALLSTONE, target = true },
	{ name = "combat", interval = 2000, chance = 16, type = COMBAT_ENERGYDAMAGE, minDamage = -100, maxDamage = -165, range = 4, shootEffect = CONST_ANI_SMALLEARTH, effect = CONST_ME_POISONAREA, target = false },
	{ name = "worm priestess paralyze", interval = 2000, chance = 12, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -115, maxDamage = -200, range = 7, radius = 3, shootEffect = CONST_ANI_DEATH, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 2000, chance = 13, type = COMBAT_EARTHDAMAGE, minDamage = -200, maxDamage = -300, range = 7, radius = 4, shootEffect = CONST_ANI_SMALLEARTH, effect = CONST_ME_HITBYPOISON, target = true },
}

monster.defenses = {
	defense = 20,
	armor = 36,
	mitigation = 1.37,
	{ name = "combat", interval = 2000, chance = 8, type = COMBAT_HEALING, minDamage = 100, maxDamage = 150, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "haste", interval = 2000, chance = 9, speedChange = 198, effect = CONST_ME_MAGIC_RED, target = false, duration = 1000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 20 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
