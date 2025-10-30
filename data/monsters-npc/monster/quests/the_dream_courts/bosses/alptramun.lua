local mType = Game.createMonsterType("Alptramun")
local monster = {}

monster.description = "Alptramun"
monster.experience = 55000
monster.outfit = {
	lookType = 1143,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 320000
monster.maxHealth = 320000
monster.race = "blood"
monster.corpse = 30155
monster.speed = 125
monster.manaCost = 0

monster.events = {
	"dreamCourtsDeath",
	"facelessHealth",
}

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.bosstiary = {
	bossRaceId = 1698, -- or 1715 need test
	bossRace = RARITY_NEMESIS,
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
	{ id = 23529, chance = 5250 }, -- ring of blue plasma
	{ id = 23531, chance = 5831 }, -- ring of green plasma
	{ id = 23533, chance = 5250 }, -- ring of red plasma
	{ id = 23542, chance = 7000 }, -- collar of blue plasma
	{ id = 23542, chance = 14000 }, -- collar of blue plasma
	{ id = 23543, chance = 10500 }, -- collar of green plasma
	{ id = 3039, chance = 19250, maxCount = 2 }, -- red gem
	{ name = "abyss hammer", chance = 1750 },
	{ name = "alptramun's toothbrush", chance = 5250 },
	{ name = "berserk potion", chance = 8750 },
	{ name = "blue gem", chance = 14000, maxCount = 2 },
	{ name = "bullseye potion", chance = 8750 },
	{ name = "chaos mace", chance = 7000 },
	{ name = "crunor idol", chance = 5250 },
	{ name = "crystal coin", chance = 14000 },
	{ name = "dream shroud", chance = 7000 },
	{ name = "energy bar", chance = 64750 },
	{ name = "giant ruby", chance = 1750 },
	{ id = 282, chance = 5250 }, -- giant shimmering pearl
	{ name = "gold ingot", chance = 14000 },
	{ name = "gold token", chance = 52500, maxCount = 2 },
	{ name = "green gem", chance = 14000, maxCount = 2 },
	{ name = "huge chunk of crude iron", chance = 26250 },
	{ name = "magic sulphur", chance = 5250 },
	{ name = "mastermind potion", chance = 42000, maxCount = 11 },
	{ name = "mysterious remains", chance = 64750 },
	{ name = "pair of dreamwalkers", chance = 3500 },
	{ name = "piggy bank", chance = 64750 },
	{ name = "platinum coin", chance = 70000, maxCount = 7 },
	{ name = "pomegranate", chance = 15750 },
	{ name = "purple tendril lantern", chance = 1750 },
	{ name = "ring of the sky", chance = 3500 },
	{ name = "royal star", chance = 42000, maxCount = 194 },
	{ name = "silver token", chance = 70000, maxCount = 5 },
	{ name = "skull staff", chance = 22750 },
	{ name = "soul stone", chance = 3500 },
	{ name = "supreme health potion", chance = 42000, maxCount = 24 },
	{ name = "ultimate mana potion", chance = 36750, maxCount = 20 },
	{ name = "ultimate spirit potion", chance = 56000, maxCount = 24 },
	{ name = "violet gem", chance = 12250 },
	{ name = "yellow gem", chance = 22750, maxCount = 2 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -200, maxDamage = -1000 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -700, maxDamage = -2000, range = 7, length = 6, spread = 0, shootEffect = CONST_ANI_POISON, effect = CONST_ME_HITBYPOISON, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -400, maxDamage = -700, range = 3, length = 6, spread = 0, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -200, maxDamage = -500, range = 3, length = 6, spread = 0, effect = CONST_ME_HITBYFIRE, target = false },
	{ name = "stone shower rune", interval = 2000, chance = 10, minDamage = -230, maxDamage = -450, range = 7, target = false },
}

monster.defenses = {
	defense = 60,
	armor = 60,
	--	mitigation = ???,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
