local mType = Game.createMonsterType("True Frost Flower Asura")
local monster = {}

monster.description = "a true frost flower asura"
monster.experience = 7069
monster.outfit = {
	lookType = 1068,
	lookHead = 9,
	lookBody = 0,
	lookLegs = 86,
	lookFeet = 9,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1622
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Asura Palace, Asura Vaults",
}

monster.health = 4000
monster.maxHealth = 4000
monster.race = "blood"
monster.corpse = 28667
monster.speed = 150
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
	targetDistance = 3,
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
	{ name = "crystal coin", chance = 5904, maxCount = 1 },
	{ id = 3035, chance = 80000, maxCount = 8 }, -- platinum coin
	{ id = 6558, chance = 15832 }, -- flask of demonic blood
	{ id = 239, chance = 16824, maxCount = 2 }, -- great health potion
	{ id = 3028, chance = 9520, maxCount = 2 }, -- small diamond
	{ id = 3032, chance = 12800, maxCount = 2 }, -- small emerald
	{ id = 3029, chance = 8776, maxCount = 2 }, -- small sapphire
	{ id = 3030, chance = 6400, maxCount = 2 }, -- small ruby
	{ id = 9057, chance = 6808, maxCount = 2 }, -- small topaz
	{ id = 3041, chance = 928 }, -- blue gem
	{ id = 6499, chance = 12224 }, -- demonic essence
	{ id = 21974, chance = 9664 }, -- golden lotus brooch
	{ id = 21981, chance = 736 }, -- oriental shoes
	{ id = 21975, chance = 8408 }, -- peacock feather fan
	{ id = 3017, chance = 7712 }, -- silver brooch
	{ id = 5944, chance = 14936 }, -- soul orb
	{ id = 8074, chance = 752 }, -- spellbook of mind control
	{ name = "small enchanted sapphire", chance = 7712, maxCount = 3 },
	{ id = 3567, chance = 1232 }, -- blue robe
	{ name = "royal star", chance = 3200, maxCount = 3 },
	{ id = 7368, chance = 7712, maxCount = 5 }, -- assassin star
	{ id = 3403, chance = 2872 }, -- tribal mask
	{ id = 9058, chance = 1904 }, -- gold ingot
	{ id = 3027, chance = 8288, maxCount = 2 }, -- black pearl
	{ id = 3037, chance = 3608 }, -- yellow gem
	{ id = 3026, chance = 6896, maxCount = 2 }, -- white pearl
	{ name = "northwind rod", chance = 2544 },
	{ id = 3054, chance = 1808 }, -- silver amulet
	{ id = 7404, chance = 584 }, -- assassin dagger
	{ id = 8061, chance = 584 }, -- skullcracker armor
	{ id = 3067, chance = 824 }, -- hailstorm rod
	{ id = 3007, chance = 656 }, -- crystal ring
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 75, maxDamage = -550, condition = { type = CONDITION_FREEZING, totalDamage = 400, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 5, type = COMBAT_MANADRAIN, minDamage = 75, maxDamage = -300, range = 7, target = false },
	{ name = "combat", interval = 1000, chance = 10, type = COMBAT_ICEDAMAGE, minDamage = -600, maxDamage = -820, length = 8, spread = 0, effect = CONST_ME_ICETORNADO, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -130, maxDamage = -330, length = 8, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "speed", interval = 2000, chance = 5, speedChange = -100, radius = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 30000 },
}

monster.defenses = {
	defense = 55,
	armor = 72,
	mitigation = 2.11,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 50, maxDamage = 100, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = -10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 100 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
