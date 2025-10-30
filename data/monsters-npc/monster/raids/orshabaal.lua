local mType = Game.createMonsterType("Orshabaal")
local monster = {}

monster.description = "Orshabaal"
monster.experience = 10000
monster.outfit = {
	lookType = 201,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 201,
	bossRace = RARITY_NEMESIS,
}

monster.health = 22500
monster.maxHealth = 22500
monster.race = "fire"
monster.corpse = 5995
monster.speed = 270
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
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
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 95,
	targetDistance = 1,
	runHealth = 2500,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = false,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.summon = {
	maxSummons = 4,
	summons = {
		{ name = "demon", chance = 10, interval = 1000, count = 4 },
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "PRAISED BE MY MASTERS, THE RUTHLESS SEVEN!", yell = true },
	{ text = "YOU ARE DOOMED!", yell = true },
	{ text = "ORSHABAAL IS BACK!", yell = true },
	{ text = "Be prepared for the day my masters will come for you!", yell = false },
	{ text = "SOULS FOR ORSHABAAL!", yell = true },
}

monster.loot = {
	{ name = "purple tome", chance = 14000 },
	{ name = "golden mug", chance = 8750 },
	{ name = "crystal necklace", chance = 14000 },
	{ name = "white pearl", chance = 23333, maxCount = 15 },
	{ name = "black pearl", chance = 17500, maxCount = 8 },
	{ name = "small diamond", chance = 14000, maxCount = 5 },
	{ name = "small sapphire", chance = 23333, maxCount = 8 },
	{ name = "small emerald", chance = 17500, maxCount = 7 },
	{ name = "small amethyst", chance = 14000, maxCount = 17 },
	{ name = "talon", chance = 14000, maxCount = 3 },
	{ name = "platinum coin", chance = 70000, maxCount = 69 },
	{ name = "green gem", chance = 4666 },
	{ name = "blue gem", chance = 14000 },
	{ id = 3046, chance = 4666 }, -- magic light wand
	{ name = "might ring", chance = 4666 },
	{ name = "silver amulet", chance = 14000 },
	{ name = "platinum amulet", chance = 8750 },
	{ name = "strange symbol", chance = 14000 },
	{ name = "orb", chance = 4666 },
	{ name = "life crystal", chance = 8750 },
	{ name = "mind stone", chance = 14000 },
	{ name = "boots of haste", chance = 8750 },
	{ name = "protection amulet", chance = 14000 },
	{ id = 3098, chance = 23333 }, -- ring of healing
	{ name = "two handed sword", chance = 8750 },
	{ name = "giant sword", chance = 17500 },
	{ name = "silver dagger", chance = 4666 },
	{ name = "golden sickle", chance = 4666 },
	{ name = "fire axe", chance = 8750 },
	{ name = "dragon hammer", chance = 4666 },
	{ name = "devil helmet", chance = 23333 },
	{ name = "golden legs", chance = 8750 },
	{ name = "magic plate armor", chance = 4666 },
	{ name = "mastermind shield", chance = 4666 },
	{ name = "demon shield", chance = 17500 },
	{ name = "Orshabaal's brain", chance = 4666 },
	{ name = "thunder hammer", chance = 4666 },
	{ name = "demon horn", chance = 35000 },
	{ id = 6299, chance = 35000 }, -- death ring
	{ name = "demonic essence", chance = 70000 },
	{ name = "assassin star", chance = 8750, maxCount = 42 },
	{ name = "great mana potion", chance = 23333 },
	{ name = "great health potion", chance = 14000 },
	{ name = "great spirit potion", chance = 8750 },
	{ name = "ultimate health potion", chance = 23333 },
	{ name = "gold ingot", chance = 4666 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -1990 },
	{ name = "combat", interval = 1000, chance = 13, type = COMBAT_MANADRAIN, minDamage = -300, maxDamage = -600, range = 7, target = false },
	{ name = "combat", interval = 1000, chance = 6, type = COMBAT_MANADRAIN, minDamage = -150, maxDamage = -350, radius = 5, effect = CONST_ME_POISONAREA, target = false },
	{ name = "effect", interval = 1000, chance = 6, radius = 5, effect = CONST_ME_HITAREA, target = false },
	{ name = "combat", interval = 1000, chance = 34, type = COMBAT_FIREDAMAGE, minDamage = -310, maxDamage = -600, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "firefield", interval = 1000, chance = 10, range = 7, radius = 4, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_ENERGYDAMAGE, minDamage = -500, maxDamage = -850, length = 8, spread = 3, effect = CONST_ME_ENERGYHIT, target = false },
}

monster.defenses = {
	defense = 111,
	armor = 90,
	--	mitigation = ???,
	{ name = "combat", interval = 1000, chance = 9, type = COMBAT_HEALING, minDamage = 1500, maxDamage = 2500, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "combat", interval = 1000, chance = 17, type = COMBAT_HEALING, minDamage = 600, maxDamage = 1000, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 1000, chance = 5, speedChange = 1901, effect = CONST_ME_MAGIC_RED, target = false, duration = 7000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 80 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -1 },
	{ type = COMBAT_HOLYDAMAGE, percent = -1 },
	{ type = COMBAT_DEATHDAMAGE, percent = 50 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
