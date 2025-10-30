local mType = Game.createMonsterType("Plagueroot")
local monster = {}

monster.description = "Plagueroot"
monster.experience = 55000
monster.outfit = {
	lookType = 1121,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 320000
monster.maxHealth = 320000
monster.race = "venom"
monster.corpse = 30022
monster.speed = 85
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
	bossRaceId = 1695,
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
	{ name = "platinum coin", chance = 70000, maxCount = 5 },
	{ name = "silver token", chance = 70000, maxCount = 3 },
	{ name = "mysterious remains", chance = 70000 },
	{ name = "huge chunk of crude iron", chance = 70000 },
	{ name = "piggy bank", chance = 70000 },
	{ name = "energy bar", chance = 70000 },
	{ name = "royal star", chance = 56000, maxCount = 184 },
	{ name = "ultimate mana potion", chance = 56000, maxCount = 22 },
	{ name = "supreme health potion", chance = 42000, maxCount = 13 },
	{ name = "gold token", chance = 42000, maxCount = 3 },
	{ id = 3039, chance = 42000 }, -- red gem
	{ name = "mastermind potion", chance = 28000, maxCount = 13 },
	{ name = "crunor idol", chance = 28000 },
	{ name = "bullseye potion", chance = 14000 },
	{ name = "ultimate spirit potion", chance = 14000 },
	{ name = "berserk potion", chance = 14000 },
	{ name = "gold ingot", chance = 14000 },
	{ name = "violet gem", chance = 14000 },
	{ name = "pomegranate", chance = 14000 },
	{ name = "blue gem", chance = 14000 },
	{ id = 282, chance = 14000 }, -- giant shimmering pearl
	{ name = "plagueroot offshoot", chance = 14000 },
	{ name = "skull staff", chance = 14000 },
	{ name = "platinum coin", chance = 70000 },
	{ name = "silver token", chance = 67144, maxCount = 5 },
	{ name = "piggy bank", chance = 65716 },
	{ name = "mysterious remains", chance = 64288 },
	{ name = "energy bar", chance = 61432 },
	{ name = "gold token", chance = 42854 },
	{ name = "ultimate spirit potion", chance = 41426, maxCount = 20 },
	{ name = "ultimate mana potion", chance = 39998, maxCount = 20 },
	{ name = "royal star", chance = 34286 },
	{ name = "supreme health potion", chance = 32858, maxCount = 20 },
	{ name = "yellow gem", chance = 28574, maxCount = 2 },
	{ name = "huge chunk of crude iron", chance = 27146 },
	{ name = "crystal coin", chance = 18571, maxCount = 3 },
	{ name = "mastermind potion", chance = 15715 },
	{ name = "gold ingot", chance = 15715 },
	{ name = "bullseye potion", chance = 14287 },
	{ name = "berserk potion", chance = 11430 },
	{ name = "skull staff", chance = 11430 },
	{ name = "pomegranate", chance = 11430 },
	{ id = 23542, chance = 10003 }, -- collar of blue plasma
	{ name = "blue gem", chance = 8568 },
	{ name = "green gem", chance = 8568 },
	{ id = 23529, chance = 7140 }, -- ring of blue plasma
	{ name = "violet gem", chance = 5712, maxCount = 2 },
	{ id = 23543, chance = 5712 }, -- collar of green plasma
	{ id = 23544, chance = 5712 }, -- collar of red plasma
	{ id = 23531, chance = 5712 }, -- ring of green plasma
	{ id = 23533, chance = 4284 }, -- ring of red plasma
	{ name = "chaos mace", chance = 4284 },
	{ name = "plagueroot offshoot", chance = 4284 },
	{ name = "magic sulphur", chance = 4284 },
	{ name = "living vine bow", chance = 2856 },
	{ name = "giant emerald", chance = 2856 },
	{ name = "soul stone", chance = 2856 },
	{ name = "living armor", chance = 2856 },
	{ name = "turquoise tendril lantern", chance = 1428 },
	{ name = "ring of the sky", chance = 1428 },
	{ name = "abyss hammer", chance = 1428 },
	{ id = 3341, chance = 2191 }, -- arcane staff
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 210, attack = -560 },
	-- fire
	{ name = "condition", type = CONDITION_FIRE, interval = 1000, chance = 7, minDamage = -200, maxDamage = -1000, range = 2, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_BLOCKHIT, target = false },
	{ name = "combat", interval = 1000, chance = 7, type = COMBAT_PHYSICALDAMAGE, minDamage = -350, maxDamage = -1050, radius = 6, effect = CONST_ME_EXPLOSIONHIT, target = false },
	{ name = "combat", interval = 1000, chance = 50, type = COMBAT_FIREDAMAGE, minDamage = -20, maxDamage = -100, radius = 5, effect = CONST_ME_BLOCKHIT, target = false },
	{ name = "firefield", interval = 1000, chance = 4, radius = 8, effect = CONST_ME_EXPLOSIONHIT, target = false },
	{ name = "combat", interval = 1000, chance = 34, type = COMBAT_FIREDAMAGE, minDamage = -350, maxDamage = -650, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "combat", interval = 1000, chance = 13, type = COMBAT_FIREDAMAGE, minDamage = -250, maxDamage = -600, length = 8, spread = 0, effect = CONST_ME_EXPLOSIONHIT, target = false },
	{ name = "combat", interval = 1000, chance = 10, type = COMBAT_FIREDAMAGE, minDamage = -350, maxDamage = -600, length = 8, spread = 0, effect = CONST_ME_FIREAREA, target = false },
}

monster.defenses = {
	defense = 60,
	armor = 60,
	--	mitigation = ???,
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_HEALING, minDamage = 500, maxDamage = 1000, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "combat", interval = 1000, chance = 25, type = COMBAT_HEALING, minDamage = 200, maxDamage = 300, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 1000, chance = 10, speedChange = 1800, effect = CONST_ME_MAGIC_RED, target = false, duration = 3000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 1 },
	{ type = COMBAT_EARTHDAMAGE, percent = 120 },
	{ type = COMBAT_FIREDAMAGE, percent = -10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
