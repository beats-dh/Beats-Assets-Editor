local mType = Game.createMonsterType("Midnight Asura")
local monster = {}

monster.description = "a midnight asura"
monster.experience = 4100
monster.outfit = {
	lookType = 150,
	lookHead = 0,
	lookBody = 114,
	lookLegs = 90,
	lookFeet = 90,
	lookAddons = 1,
	lookMount = 0,
}

monster.raceId = 1135
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Asura Palace.",
}

monster.health = 3100
monster.maxHealth = 3100
monster.race = "blood"
monster.corpse = 21988
monster.speed = 120
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
	staticAttackChance = 80,
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
	{ text = "Death and Darkness!", yell = false },
	{ text = "Embrace the night!", yell = false },
	{ text = "May night fall upon you!", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 56784, maxCount = 100 }, -- gold coin
	{ id = 3035, chance = 64400, maxCount = 6 }, -- platinum coin
	{ id = 7368, chance = 5312, maxCount = 5 }, -- assassin star
	{ id = 3027, chance = 2936, maxCount = 2 }, -- black pearl
	{ id = 3007, chance = 352 }, -- crystal ring
	{ id = 6558, chance = 11288 }, -- flask of demonic blood
	{ id = 6499, chance = 7960 }, -- demonic essence
	{ id = 3028, chance = 4544, maxCount = 3 }, -- small diamond
	{ id = 3032, chance = 2592, maxCount = 1 }, -- small emerald
	{ id = 3030, chance = 2472, maxCount = 1 }, -- small ruby
	{ id = 3029, chance = 4440, maxCount = 3 }, -- small sapphire
	{ id = 9057, chance = 2328, maxCount = 1 }, -- small topaz
	{ id = 239, chance = 6760, maxCount = 2 }, -- great health potion
	{ id = 3026, chance = 4528 }, -- white pearl
	{ id = 7404, chance = 280 }, -- assassin dagger
	{ id = 3041, chance = 232 }, -- blue gem
	{ id = 3567, chance = 424 }, -- blue robe
	{ id = 9058, chance = 112 }, -- gold ingot
	{ id = 21974, chance = 10160 }, -- golden lotus brooch
	{ id = 3069, chance = 1968 }, -- necrotic rod
	{ id = 21981, chance = 312 }, -- oriental shoes
	{ id = 21975, chance = 8592 }, -- peacock feather fan
	{ id = 8061, chance = 144 }, -- skullcracker armor
	{ id = 3017, chance = 2920 }, -- silver brooch
	{ id = 3054, chance = 840 }, -- silver amulet
	{ id = 5944, chance = 11664 }, -- soul orb
	{ id = 8074, chance = 120 }, -- spellbook of mind control
	{ id = 3403, chance = 1624 }, -- tribal mask
	{ id = 8082, chance = 608 }, -- underworld rod
	{ id = 3037, chance = 696 }, -- yellow gem
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -387 },
	{ name = "combat", interval = 3300, chance = 10, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -70, range = 7, target = true },
	{ name = "combat", interval = 3700, chance = 17, type = COMBAT_ENERGYDAMAGE, minDamage = -150, maxDamage = -200, length = 5, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "combat", interval = 4100, chance = 27, type = COMBAT_DEATHDAMAGE, minDamage = -150, maxDamage = -300, length = 8, spread = 0, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2700, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -50, maxDamage = -200, range = 5, shootEffect = CONST_ANI_SUDDENDEATH, target = true },
	{ name = "combat", interval = 3100, chance = 15, type = COMBAT_ENERGYDAMAGE, minDamage = -50, maxDamage = -100, range = 1, shootEffect = CONST_ANI_ENERGY, target = true },
	{ name = "speed", interval = 2000, chance = 20, speedChange = -800, radius = 1, shootEffect = CONST_ANI_EXPLOSION, effect = CONST_ME_SLEEP, target = true, duration = 15000 },
}

monster.defenses = {
	defense = 55,
	armor = 55,
	mitigation = 1.60,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 50, maxDamage = 100, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
