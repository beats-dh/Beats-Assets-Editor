local mType = Game.createMonsterType("Shaper Matriarch")
local monster = {}

monster.description = "a shaper matriarch"
monster.experience = 1650
monster.outfit = {
	lookType = 933,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1394
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Old Masonry, Astral Shaper Ruins, small dungeon under the Formorgar Mines.",
}

monster.health = 2000
monster.maxHealth = 2000
monster.race = "blood"
monster.corpse = 25071
monster.speed = 130
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 0,
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
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 4,
	runHealth = 15,
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
	{ text = "Tar Marra Zik Tazz!", yell = false },
}

monster.loot = {
	{ id = 24390, chance = 4800 }, -- ancient coin
	{ id = 3027, chance = 2000 }, -- black pearl
	{ id = 24383, chance = 14400, maxCount = 2 }, -- cave turnip
	{ id = 24385, chance = 12000 }, -- cracked alabaster vase
	{ id = 3728, chance = 5440 }, -- dark mushroom
	{ id = 24392, chance = 3440 }, -- gemmed figurine
	{ id = 3031, chance = 40256, maxCount = 150 }, -- gold coin
	{ id = 3035, chance = 64000, maxCount = 2 }, -- platinum coin
	{ id = 24962, chance = 2240 }, -- prismatic quartz
	{ id = 24386, chance = 16000 }, -- rhino horn carving
	{ id = 3098, chance = 1040 }, -- ring of healing
	{ id = 8908, chance = 3600 }, -- slightly rusted helmet
	{ id = 3114, chance = 8000 }, -- skull
	{ id = 3030, chance = 3200 }, -- small ruby
	{ id = 3081, chance = 1200 }, -- stone skin amulet
	{ id = 237, chance = 12000 }, -- strong mana potion
	{ id = 24387, chance = 12000 }, -- tarnished rhino figurine
	{ id = 3072, chance = 1600 }, -- wand of decay
	{ id = 8094, chance = 640 }, -- wand of voodoo
	{ id = 2901, chance = 1600 }, -- waterskin
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 15, attack = 25 },
	{ name = "combat", interval = 2000, chance = 35, type = COMBAT_PHYSICALDAMAGE, minDamage = -35, maxDamage = -160, range = 7, shootEffect = CONST_ANI_EARTH, effect = CONST_ME_POISONAREA, target = false },
	{ name = "combat", interval = 2000, chance = 35, type = COMBAT_PHYSICALDAMAGE, minDamage = -35, maxDamage = -160, radius = 3, effect = CONST_ME_ENERGYHIT, target = false },
	{ name = "combat", interval = 2000, chance = 35, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -400, length = 6, spread = 3, effect = CONST_ME_MORTAREA, target = false },
}

monster.defenses = {
	defense = 40,
	armor = 40,
	mitigation = 1.18,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 400, maxDamage = 500, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 40 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
