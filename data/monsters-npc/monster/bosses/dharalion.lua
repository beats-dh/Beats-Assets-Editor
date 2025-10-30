local mType = Game.createMonsterType("Dharalion")
local monster = {}

monster.description = "Dharalion"
monster.experience = 570
monster.outfit = {
	lookType = 203,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 203,
	bossRace = RARITY_NEMESIS,
}

monster.health = 380
monster.maxHealth = 380
monster.race = "blood"
monster.corpse = 6011
monster.speed = 120
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.strategiesTarget = {
	nearest = 10,
	health = 10,
	damage = 20,
	random = 60,
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
	targetDistance = 4,
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

monster.summon = {
	maxSummons = 2,
	summons = {
		{ name = "demon skeleton", chance = 6, interval = 1000, count = 2 },
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Feel my wrath!", yell = false },
	{ text = "No one will stop my ascension!", yell = false },
	{ text = "My powers are divine!", yell = false },
	{ text = "You desecrated this temple!", yell = false },
	{ text = "Muahahaha!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 70000, maxCount = 100 },
	{ name = "holy orchid", chance = 70000 },
	{ name = "elvish talisman", chance = 61600 },
	{ name = "elven astral observer", chance = 57400 },
	{ name = "yellow gem", chance = 29253 },
	{ name = "blank rune", chance = 17759, maxCount = 1 },
	{ name = "melon", chance = 15673 },
	{ name = "bread", chance = 11494 },
	{ name = "elven amulet", chance = 10451 },
	{ name = "great mana potion", chance = 9401 },
	{ name = "life crystal", chance = 9401 },
	{ name = "sling herb", chance = 6272 },
	{ id = 3257, chance = 5222 }, -- cornucopia
	{ name = "green tunic", chance = 3136 },
	{ name = "royal spear", chance = 1043, maxCount = 2 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 30, attack = 28 },
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_MANADRAIN, minDamage = -30, maxDamage = -60, range = 7, target = false },
	{ name = "combat", interval = 1000, chance = 13, type = COMBAT_ENERGYDAMAGE, minDamage = -70, maxDamage = -90, range = 7, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYHIT, target = false },
	{ name = "combat", interval = 1000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -80, maxDamage = -151, range = 7, shootEffect = CONST_ANI_SUDDENDEATH, target = false },
	{ name = "effect", interval = 1000, chance = 13, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 15,
	--	mitigation = ???,
	{ name = "combat", interval = 1000, chance = 20, type = COMBAT_HEALING, minDamage = 90, maxDamage = 120, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 1000, chance = 7, speedChange = 300, effect = CONST_ME_MAGIC_RED, target = false, duration = 10000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
