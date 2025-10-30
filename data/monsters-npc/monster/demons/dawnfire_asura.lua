local mType = Game.createMonsterType("Dawnfire Asura")
local monster = {}

monster.description = "a dawnfire asura"
monster.experience = 4100
monster.outfit = {
	lookType = 150,
	lookHead = 114,
	lookBody = 94,
	lookLegs = 78,
	lookFeet = 79,
	lookAddons = 1,
	lookMount = 0,
}

monster.raceId = 1134
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Asura Palace.",
}

monster.health = 2900
monster.maxHealth = 2900
monster.race = "blood"
monster.corpse = 21987
monster.speed = 140
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
	{ text = "May the flames consume you!", yell = false },
	{ text = "Encounter the flames of destiny!", yell = false },
	{ text = "Fire and destruction!", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 55352, maxCount = 100 }, -- gold coin
	{ id = 3035, chance = 67312, maxCount = 9 }, -- platinum coin
	{ id = 6558, chance = 16728, maxCount = 2 }, -- flask of demonic blood
	{ id = 238, chance = 6872, maxCount = 2 }, -- great mana potion
	{ id = 3033, chance = 2512, maxCount = 1 }, -- small amethyst
	{ id = 3028, chance = 2344, maxCount = 1 }, -- small diamond
	{ id = 3032, chance = 2824, maxCount = 1 }, -- small emerald
	{ id = 3030, chance = 4608, maxCount = 1 }, -- small ruby
	{ id = 9057, chance = 2272, maxCount = 1 }, -- small topaz
	{ id = 3041, chance = 176 }, -- blue gem
	{ id = 6299, chance = 272 }, -- death ring
	{ id = 6499, chance = 8528 }, -- demonic essence
	{ id = 8043, chance = 696 }, -- focus cape
	{ id = 21974, chance = 984 }, -- golden lotus brooch
	{ id = 826, chance = 456 }, -- magma coat
	{ id = 3078, chance = 928 }, -- mysterious fetish
	{ id = 3574, chance = 1752 }, -- mystic turban
	{ id = 21981, chance = 248 }, -- oriental shoes
	{ id = 21975, chance = 8888 }, -- peacock feather fan
	{ id = 5911, chance = 1872 }, -- red piece of cloth
	{ id = 3016, chance = 640 }, -- ruby necklace
	{ id = 5944, chance = 11648 }, -- soul orb
	{ id = 8074, chance = 64 }, -- spellbook of mind control
	{ id = 3071, chance = 728 }, -- wand of inferno
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -269 },
	{ name = "combat", interval = 3700, chance = 17, type = COMBAT_LIFEDRAIN, minDamage = -100, maxDamage = -300, length = 8, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "combat", interval = 3200, chance = 25, type = COMBAT_DEATHDAMAGE, minDamage = -100, maxDamage = -350, radius = 4, range = 5, target = true, effect = CONST_ME_MORTAREA },
	{ name = "combat", interval = 2700, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -95, maxDamage = -180, range = 3, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "speed", interval = 2000, chance = 20, speedChange = -800, radius = 1, shootEffect = CONST_ANI_EXPLOSION, effect = CONST_ME_SLEEP, target = true, duration = 15000 },
}

monster.defenses = {
	defense = 55,
	armor = 48,
	mitigation = 1.46,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 50, maxDamage = 100, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
