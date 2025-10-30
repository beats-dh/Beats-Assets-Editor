local mType = Game.createMonsterType("Lost Soul")
local monster = {}

monster.description = "a lost soul"
monster.experience = 4000
monster.outfit = {
	lookType = 232,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 283
monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_UNDEAD,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Pits of Inferno, Formorgar Mines, Helheim, Roshamuul Prison and in The Arcanum Part of the Inquisition quest, Oramond Fury Dungeon",
}

monster.health = 5800
monster.maxHealth = 5800
monster.race = "undead"
monster.corpse = 6309
monster.speed = 190
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 15,
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
	runHealth = 450,
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
	{ text = "Mouuuurn meeee!", yell = false },
	{ text = "Forgive Meee!", yell = false },
	{ text = "Help meee!", yell = false },
}

monster.loot = {
	{ name = "ruby necklace", chance = 1200 },
	{ name = "white pearl", chance = 8000, maxCount = 3 },
	{ name = "black pearl", chance = 9600, maxCount = 3 },
	{ name = "gold coin", chance = 80000, maxCount = 198 },
	{ name = "platinum coin", chance = 80000, maxCount = 7 },
	{ id = 3039, chance = 12000 }, -- red gem
	{ name = "stone skin amulet", chance = 2224 },
	{ name = "blank rune", chance = 28200, maxCount = 3 },
	{ name = "skull staff", chance = 680 },
	{ name = "tower shield", chance = 592 },
	{ name = "skull helmet", chance = 136 },
	{ id = 5806, chance = 3960 }, -- silver goblet
	{ name = "soul orb", chance = 12000 },
	{ id = 6299, chance = 1736 }, -- death ring
	{ name = "demonic essence", chance = 6000 },
	{ name = "skeleton decoration", chance = 1000 },
	{ name = "haunted blade", chance = 592 },
	{ name = "titan axe", chance = 800 },
	{ name = "great mana potion", chance = 11360, maxCount = 2 },
	{ name = "great health potion", chance = 7040, maxCount = 2 },
	{ id = 8896, chance = 2800 }, -- slightly rusted armor
	{ name = "unholy bone", chance = 26408 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -420 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -40, maxDamage = -210, length = 3, spread = 0, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "speed", interval = 2000, chance = 20, speedChange = -800, radius = 6, effect = CONST_ME_SMALLCLOUDS, target = false, duration = 4000 },
}

monster.defenses = {
	defense = 30,
	armor = 28,
	mitigation = 1.60,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 50 },
	{ type = COMBAT_HOLYDAMAGE, percent = -25 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
