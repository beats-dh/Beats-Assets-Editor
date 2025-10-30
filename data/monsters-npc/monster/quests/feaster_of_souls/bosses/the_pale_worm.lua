local mType = Game.createMonsterType("The Pale Worm")
local monster = {}

monster.description = "The Pale Worm"
monster.experience = 128000
monster.outfit = {
	lookType = 1272,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 210000
monster.maxHealth = 210000
monster.race = "undead"
monster.corpse = 32702
monster.speed = 125
monster.manaCost = 0

monster.events = {
	"ThePaleWormHealthChange",
	"PaleWormDeath",
	"FeasterOfSoulsBossDeath",
}

monster.changeTarget = {
	interval = 60000,
	chance = 0,
}

monster.bosstiary = {
	bossRaceId = 1881,
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
	canPushCreatures = false,
	staticAttackChance = 95,
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
	{ name = "crystal coin", chance = 67256, maxCount = 2 },
	{ name = "white gem", chance = 37058, maxCount = 2 },
	{ name = "moonstone", chance = 37058, maxCount = 2 },
	{ name = "ultimate mana potion", chance = 30198, maxCount = 6 },
	{ name = "supreme health potion", chance = 20587, maxCount = 6 },
	{ name = "silver hand mirror", chance = 19215 },
	{ name = "berserk potion", chance = 16471, maxCount = 10 },
	{ name = "ultimate spirit potion", chance = 16471, maxCount = 6 },
	{ name = "bullseye potion", chance = 13727, maxCount = 10 },
	{ name = "mastermind potion", chance = 13727, maxCount = 10 },
	{ name = "transcendence potion", chance = 13727, maxCount = 10 },
	{ name = "death toll", chance = 9611, maxCount = 2 },
	{ name = "ivory comb", chance = 9611 },
	{ name = "angel figurine", chance = 8232 },
	{ name = "diamond", chance = 8232 },
	{ name = "cursed bone", chance = 5488 },
	{ name = "soulforged lantern", chance = 5488 },
	{ name = "grimace", chance = 4116 },
	{ name = "amber", chance = 4116 },
	{ name = "amber with a dragonfly", chance = 2744 },
	{ name = "ghost claw", chance = 1372 },
	{ name = "bloody tears", chance = 1050 },
	{ name = "ghost chestplate", chance = 105 },
	{ name = "spooky hood", chance = 105 },
	{ name = "pale worm's scalp", chance = 840 },
	{ name = "spectral scrap of cloth", chance = 175 },
	{ name = "fabulous legs", chance = 105 },
	{ name = "phantasmal axe", chance = 105 },
	{ name = "ghost backpack", chance = 105 },
	{ id = 32621, chance = 280 }, -- Ring of souls
	{ name = "soulful legs", chance = 105 },
	{ name = "jade legs", chance = 105 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 600, maxDamage = -1050, condition = { type = CONDITION_POISON, totalDamage = 4, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_LIFEDRAIN, minDamage = -900, maxDamage = -1400, effect = CONST_ME_MAGIC_RED, target = true },
	{ name = "combat", interval = 1000, chance = 30, type = COMBAT_PHYSICALDAMAGE, minDamage = -1000, maxDamage = -1750, radius = 2, shootEffect = CONST_ANI_SMALLEARTH, effect = CONST_ME_HITBYPOISON, target = false },
	{ name = "drunk", interval = 1000, chance = 15, range = 7, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYAREA, target = false },
	{ name = "strength", interval = 1000, chance = 30, range = 7, shootEffect = CONST_ANI_LARGEROCK, effect = CONST_ME_ENERGYAREA, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_ENERGYDAMAGE, minDamage = 0, maxDamage = -900, length = 5, spread = 3, effect = CONST_ME_ENERGYHIT, target = false },
	{ name = "combat", interval = 1000, chance = 35, type = COMBAT_FIREDAMAGE, minDamage = -600, maxDamage = -1200, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "speed", interval = 3000, chance = 20, speedChange = -700, effect = CONST_ME_MAGIC_RED, target = true, duration = 20000 },
}

monster.defenses = {
	defense = 150,
	armor = 150,
	--	mitigation = ???,
	{ name = "speed", interval = 10000, chance = 20, speedChange = 510, effect = CONST_ME_MAGIC_GREEN, target = false, duration = 20000 },
	{ name = "combat", interval = 5000, chance = 15, type = COMBAT_HEALING, minDamage = 600, maxDamage = 1200, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 95 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 95 },
	{ type = COMBAT_EARTHDAMAGE, percent = 95 },
	{ type = COMBAT_FIREDAMAGE, percent = 95 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 95 },
	{ type = COMBAT_HOLYDAMAGE, percent = 95 },
	{ type = COMBAT_DEATHDAMAGE, percent = 95 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
