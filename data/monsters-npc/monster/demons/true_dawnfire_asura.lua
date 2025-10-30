local mType = Game.createMonsterType("True Dawnfire Asura")
local monster = {}

monster.description = "a true dawnfire asura"
monster.experience = 7475
monster.outfit = {
	lookType = 1068,
	lookHead = 114,
	lookBody = 94,
	lookLegs = 79,
	lookFeet = 121,
	lookAddons = 1,
	lookMount = 0,
}

monster.raceId = 1620
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Asura Palace, Asura Vaults.",
}

monster.health = 8500
monster.maxHealth = 8500
monster.race = "blood"
monster.corpse = 28664
monster.speed = 180
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
}

monster.loot = {
	{ id = 3035, chance = 80000, maxCount = 8 }, -- platinum coin
	{ name = "crystal coin", chance = 3736, maxCount = 1 },
	{ id = 6558, chance = 24088 }, -- flask of demonic blood
	{ id = 238, chance = 13248, maxCount = 2 }, -- great mana potion
	{ id = 3033, chance = 5448, maxCount = 2 }, -- small amethyst
	{ id = 3028, chance = 6000, maxCount = 2 }, -- small diamond
	{ id = 3032, chance = 14408, maxCount = 2 }, -- small emerald
	{ name = "small enchanted ruby", chance = 7552, maxCount = 3 },
	{ id = 3030, chance = 9512, maxCount = 2 }, -- small ruby
	{ id = 9057, chance = 6848, maxCount = 2 }, -- small topaz
	{ name = "royal star", chance = 3240, maxCount = 3 },
	{ id = 3041, chance = 1040 }, -- blue gem
	{ id = 3039, chance = 3040 }, -- red gem
	{ id = 6299, chance = 880 }, -- death ring
	{ id = 6499, chance = 17688 }, -- demonic essence
	{ id = 8043, chance = 1760 }, -- focus cape
	{ id = 21974, chance = 9120 }, -- golden lotus brooch
	{ id = 826, chance = 1584 }, -- magma coat
	{ id = 3078, chance = 2256 }, -- mysterious fetish
	{ id = 3574, chance = 2536 }, -- mystic turban
	{ id = 21981, chance = 1688 }, -- oriental shoes
	{ id = 21975, chance = 9168 }, -- peacock feather fan
	{ id = 5911, chance = 2456 }, -- red piece of cloth
	{ id = 3016, chance = 1864 }, -- ruby necklace
	{ id = 5944, chance = 16112 }, -- soul orb
	{ id = 8074, chance = 496 }, -- spellbook of mind control
	{ id = 3071, chance = 1152 }, -- wand of inferno
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -700, condition = { type = CONDITION_FIRE, totalDamage = 500, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 5, type = COMBAT_MANADRAIN, minDamage = -50, maxDamage = -300, range = 7, target = false }, -- mana drain beam
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -450, maxDamage = -830, length = 1, spread = 0, effect = CONST_ME_HITBYFIRE, target = false }, -- fire missile
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -550, maxDamage = -750, radius = 4, effect = CONST_ME_BLACKSMOKE, target = false }, -- death ball
	{ name = "speed", interval = 2000, chance = 5, speedChange = -200, radius = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 30000 }, -- smoke berserk
}

monster.defenses = {
	defense = 55,
	armor = 77,
	mitigation = 2.16,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 50, maxDamage = 100, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
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
