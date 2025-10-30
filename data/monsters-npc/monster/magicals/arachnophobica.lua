local mType = Game.createMonsterType("Arachnophobica")
local monster = {}

monster.description = "an arachnophobica"
monster.experience = 4700
monster.outfit = {
	lookType = 1135,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1729
monster.Bestiary = {
	class = "Magical",
	race = BESTY_RACE_MAGICAL,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Buried Cathedral, Haunted Cellar, Court of Summer, Court of Winter, Dream Labyrinth.",
}

monster.health = 5000
monster.maxHealth = 5000
monster.race = "blood"
monster.corpse = 30073
monster.speed = 200
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
	{ text = "Tip tap tip tap!", yell = false },
	{ text = "Zip zip zip!!!", yell = false },
}

monster.loot = {
	{ name = "platinum coin", chance = 64728, maxCount = 13 },
	{ name = "great spirit potion", chance = 23256, maxCount = 3 },
	{ name = "essence of a bad dream", chance = 5976 },
	{ id = 3051, chance = 3656 }, -- energy ring
	{ name = "silver amulet", chance = 4808 },
	{ id = 3091, chance = 4224 }, -- sword ring
	{ name = "spider fangs", chance = 7928 },
	{ name = "mind stone", chance = 3464 },
	{ name = "wand of cosmic energy", chance = 3352 },
	{ name = "magma amulet", chance = 1736 },
	{ name = "elven amulet", chance = 2048, maxCount = 2 },
	{ id = 23544, chance = 1072 }, -- collar of red plasma
	{ name = "sacred tree amulet", chance = 1688 },
	{ name = "spider silk", chance = 944 },
	{ id = 3052, chance = 2264 }, -- life ring
	{ name = "orb", chance = 1720 },
	{ name = "underworld rod", chance = 1704 },
	{ id = 23529, chance = 1072 }, -- ring of blue plasma
	{ id = 3098, chance = 656 }, -- ring of healing
	{ name = "strange talisman", chance = 512 },
	{ id = 3092, chance = 1880 }, -- axe ring
	{ id = 3050, chance = 1848 }, -- power ring
	{ id = 6299, chance = 1360 }, -- death ring
	{ name = "garlic necklace", chance = 800 },
	{ name = "platinum amulet", chance = 1336 },
	{ id = 23543, chance = 312 }, -- collar of green plasma
	{ name = "strange symbol", chance = 376 },
	{ name = "stone skin amulet", chance = 272 },
	{ name = "necklace of the deep", chance = 616 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -350 },
	{ name = "arachnophobicawavedice", interval = 2000, chance = 20, minDamage = -250, maxDamage = -350, target = false },
	{ name = "arachnophobicawaveenergy", interval = 2000, chance = 20, minDamage = -250, maxDamage = -350, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -250, maxDamage = -350, radius = 4, effect = CONST_ME_BLOCKHIT, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -200, maxDamage = -300, range = 7, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_SMALLCLOUDS, target = false },
}

monster.defenses = {
	defense = 0,
	armor = 70,
	mitigation = 1.94,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 150, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 50 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -40 },
	{ type = COMBAT_DEATHDAMAGE, percent = 50 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
