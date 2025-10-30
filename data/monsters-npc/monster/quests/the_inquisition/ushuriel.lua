local mType = Game.createMonsterType("Ushuriel")
local monster = {}

monster.description = "Ushuriel"
monster.experience = 10000
monster.outfit = {
	lookType = 12,
	lookHead = 0,
	lookBody = 57,
	lookLegs = 0,
	lookFeet = 80,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"InquisitionBossDeath",
}

monster.health = 31500
monster.maxHealth = 31500
monster.race = "fire"
monster.corpse = 6068
monster.speed = 220
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.bosstiary = {
	bossRaceId = 415,
	bossRace = RARITY_BANE,
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
	staticAttackChance = 85,
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
	{ text = "You can't run or hide forever!", yell = false },
	{ text = "I'm the executioner of the Seven!", yell = false },
	{ text = "The final punishment awaits you!", yell = false },
	{ text = "The judgement is guilty! The sentence is death!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 40000, maxCount = 190 },
	{ name = "platinum coin", chance = 16000, maxCount = 26 },
	{ name = "orb", chance = 13333 },
	{ name = "life crystal", chance = 13333 },
	{ name = "mind stone", chance = 16000 },
	{ name = "spike sword", chance = 7272 },
	{ name = "fire sword", chance = 11428 },
	{ name = "giant sword", chance = 6154 },
	{ id = 3307, chance = 8889 }, -- scimitar
	{ name = "warrior helmet", chance = 16000 },
	{ name = "strange helmet", chance = 6666 },
	{ name = "crown helmet", chance = 5000 },
	{ name = "royal helmet", chance = 16000 },
	{ name = "brown mushroom", chance = 40000, maxCount = 30 },
	{ name = "mysterious voodoo skull", chance = 10000 },
	{ name = "skull helmet", chance = 16000 },
	{ name = "iron ore", chance = 26666 },
	{ id = 5884, chance = 3809 }, -- spirit container
	{ name = "flask of warrior's sweat", chance = 4444 },
	{ name = "enchanted chicken wing", chance = 6154 },
	{ name = "huge chunk of crude iron", chance = 11428 },
	{ name = "hardened bone", chance = 20000, maxCount = 20 },
	{ name = "demon horn", chance = 6666, maxCount = 2 },
	{ id = 6103, chance = 1650 }, -- unholy book
	{ name = "demonic essence", chance = 80000 },
	{ id = 7385, chance = 8000 }, -- crimson sword
	{ name = "thaian sword", chance = 20000 },
	{ name = "dragon slayer", chance = 6666 },
	{ name = "runed sword", chance = 5333 },
	{ name = "great mana potion", chance = 16000 },
	{ name = "great health potion", chance = 16000 },
	{ name = "great spirit potion", chance = 16000 },
	{ name = "ultimate health potion", chance = 16000 },
	{ id = 8894, chance = 16000 }, -- heavily rusted armor
	{ name = "gold ingot", chance = 13333 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -1088 },
	{ name = "combat", interval = 1000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -250, maxDamage = -500, length = 10, spread = 3, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 1000, chance = 8, type = COMBAT_DEATHDAMAGE, minDamage = -30, maxDamage = -760, radius = 5, shootEffect = CONST_ANI_DEATH, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2000, chance = 9, type = COMBAT_EARTHDAMAGE, minDamage = -200, maxDamage = -585, length = 8, spread = 3, effect = CONST_ME_SMALLPLANTS, target = false },
	{ name = "combat", interval = 1000, chance = 8, type = COMBAT_ICEDAMAGE, minDamage = 0, maxDamage = -430, radius = 6, effect = CONST_ME_ICETORNADO, target = false },
	{ name = "drunk", interval = 3000, chance = 11, radius = 6, effect = CONST_ME_SOUND_PURPLE, target = false },
	-- energy damage
	{ name = "condition", type = CONDITION_ENERGY, interval = 2000, chance = 15, minDamage = -250, maxDamage = -250, radius = 4, effect = CONST_ME_ENERGYHIT, target = false },
}

monster.defenses = {
	defense = 45,
	armor = 50,
	{ name = "combat", interval = 1000, chance = 12, type = COMBAT_HEALING, minDamage = 400, maxDamage = 600, effect = CONST_ME_MAGIC_GREEN, target = false },
	{ name = "speed", interval = 1000, chance = 4, speedChange = 400, effect = CONST_ME_MAGIC_BLUE, target = false, duration = 7000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 50 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 30 },
	{ type = COMBAT_EARTHDAMAGE, percent = 30 },
	{ type = COMBAT_FIREDAMAGE, percent = 30 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 30 },
	{ type = COMBAT_HOLYDAMAGE, percent = 25 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
