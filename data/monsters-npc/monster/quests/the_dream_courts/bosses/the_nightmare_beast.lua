local mType = Game.createMonsterType("The Nightmare Beast")
local monster = {}

monster.description = "The Nightmare Beast"
monster.experience = 75000
monster.outfit = {
	lookType = 1144,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 850000
monster.maxHealth = 850000
monster.race = "blood"
monster.corpse = 30159
monster.speed = 125
monster.manaCost = 0

monster.events = {
	"dreamCourtsDeath",
}

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.bosstiary = {
	bossRaceId = 1718,
	bossRace = RARITY_ARCHFOE,
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
	rewardBoss = true,
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
}

monster.loot = {
	{ id = 23542, chance = 4515 }, -- collar of blue plasma
	{ id = 23529, chance = 2261 }, -- ring of blue plasma
	{ id = 23531, chance = 11290 }, -- ring of green plasma
	{ id = 23533, chance = 6776 }, -- ring of red plasma
	{ id = 23543, chance = 6776 }, -- collar of green plasma
	{ id = 23544, chance = 9030 }, -- collar of red plasma
	{ id = 30342, chance = 1981 }, -- enchanted sleep shawl
	{ id = 3039, chance = 29358, maxCount = 2 }, -- red gem
	{ name = "abyss hammer", chance = 1981 },
	{ id = 3341, chance = 2191 }, -- arcane staff
	{ name = "beast's nightmare-cushion", chance = 2639 },
	{ name = "berserk potion", chance = 11290, maxCount = 9 },
	{ name = "blue gem", chance = 4515 },
	{ name = "bullseye potion", chance = 22581, maxCount = 19 },
	{ name = "chaos mace", chance = 7266 },
	{ name = "crystal coin", chance = 15806, maxCount = 3 },
	{ name = "dark whispers", chance = 2261 },
	{ name = "dragon figurine", chance = 5285 },
	{ name = "energy bar", chance = 64057 },
	{ name = "giant emerald", chance = 1323 },
	{ name = "giant ruby", chance = 4515 },
	{ name = "giant sapphire", chance = 1981 },
	{ id = 282, chance = 6776 }, -- giant shimmering pearl
	{ name = "gold ingot", chance = 11290 },
	{ name = "gold token", chance = 44905 },
	{ name = "green gem", chance = 13545 },
	{ name = "huge chunk of crude iron", chance = 27097 },
	{ name = "ice shield", chance = 6776 },
	{ name = "magic sulphur", chance = 5943 },
	{ name = "mastermind potion", chance = 9030, maxCount = 18 },
	{ name = "mysterious remains", chance = 65380 },
	{ name = "transcendence potion", chance = 9030, maxCount = 18 },
	{ name = "piggy bank", chance = 70000 },
	{ name = "piggy bank", chance = 66038 },
	{ name = "platinum coin", chance = 70000, maxCount = 9 },
	{ name = "purple tendril lantern", chance = 4620 },
	{ name = "ring of the sky", chance = 3304 },
	{ name = "royal star", chance = 33873, maxCount = 193 },
	{ name = "silver token", chance = 68677, maxCount = 4 },
	{ name = "skull staff", chance = 9030 },
	{ name = "soul stone", chance = 3304 },
	{ name = "supreme health potion", chance = 40642, maxCount = 29 },
	{ name = "turquoise tendril lantern", chance = 5285 },
	{ name = "dark vision bandana", chance = 3045 },
	{ name = "ultimate mana potion", chance = 45163, maxCount = 29 },
	{ name = "ultimate spirit potion", chance = 40642, maxCount = 24 },
	{ name = "violet gem", chance = 4515 },
	{ name = "yellow gem", chance = 31612, maxCount = 2 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "combat", interval = 2000, chance = 100, type = COMBAT_PHYSICALDAMAGE, minDamage = -1000, maxDamage = -3500, target = true }, -- basic attack (1000-3500)
	{ name = "death beam", interval = 2000, chance = 25, minDamage = -1000, maxDamage = -2100, target = false }, -- -_death_beam(1000-2100)
	{ name = "big death wave", interval = 2000, chance = 25, minDamage = -1000, maxDamage = -2000, target = false }, -- -_death_wave(1000-2000)
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_DEATHDAMAGE, minDamage = -700, maxDamage = -1000, radius = 5, effect = CONST_ME_MORTAREA, target = false }, -- -_great_death_bomb(700-1000)
}

monster.defenses = {
	defense = 160,
	armor = 160,
	--	mitigation = ???,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 35 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 15 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
