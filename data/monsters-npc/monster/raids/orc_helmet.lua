local mType = Game.createMonsterType("Orc Helmet")
local monster = {}

monster.name = "Orc Warlord"
monster.description = "an orc warlord"
monster.experience = 670
monster.outfit = {
	lookType = 2,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 950
monster.maxHealth = 950
monster.race = "blood"
monster.corpse = 6008
monster.speed = 117
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
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
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
	{ text = "Ranat Ulderek!", yell = false },
	{ text = "Orc buta bana!", yell = false },
	{ text = "Ikem rambo zambo!", yell = false },
	{ text = "Fetchi Maruk Buta", yell = false },
}

monster.loot = {
	{ id = 11453, chance = 20000 }, -- broken helmet
	{ id = 11479, chance = 16000 }, -- orc leather
	{ id = 3031, chance = 14400, maxCount = 45 }, -- gold coin
	{ id = 3287, chance = 11200, maxCount = 18 }, -- throwing star
	{ id = 3578, chance = 8640, maxCount = 2 }, -- fish
	{ id = 10196, chance = 7600 }, -- orc tooth
	{ id = 3316, chance = 4160 }, -- orcish axe
	{ id = 3347, chance = 4160 }, -- hunting spear
	{ id = 3357, chance = 4088 }, -- plate armor
	{ id = 11480, chance = 3688 }, -- skull belt
	{ id = 3557, chance = 3344 }, -- plate legs
	{ id = 3307, chance = 2840 }, -- scimitar
	{ id = 3084, chance = 1752 }, -- protection amulet
	{ id = 3265, chance = 1440 }, -- two handed sword
	{ id = 3384, chance = 1120 }, -- dark helmet
	{ id = 3359, chance = 536 }, -- brass armor
	{ id = 266, chance = 336 }, -- health potion
	{ id = 3391, chance = 272 }, -- crusader helmet
	{ id = 3322, chance = 232 }, -- dragon hammer
	{ id = 818, chance = 200 }, -- magma boots
	{ id = 7395, chance = 64 }, -- orc trophy
	{ id = 3049, chance = 64 }, -- stealth ring
	{ id = 3393, chance = 4000 }, -- amazon helmet
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -250 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -200, range = 7, shootEffect = CONST_ANI_THROWINGSTAR, target = false },
}

monster.defenses = {
	defense = 35,
	armor = 35,
	{ name = "invisible", interval = 2000, chance = 5, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = 80 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
