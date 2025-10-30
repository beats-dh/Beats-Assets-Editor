local mType = Game.createMonsterType("Elf Overseer")
local monster = {}

monster.description = "an elf overseer"
monster.experience = 200
monster.outfit = {
	lookType = 159,
	lookHead = 57,
	lookBody = 95,
	lookLegs = 114,
	lookFeet = 116,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 741
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 5,
	FirstUnlock = 2,
	SecondUnlock = 3,
	CharmsPoints = 50,
	Stars = 3,
	Occurrence = 3,
	Locations = "Shadowthorn",
}

monster.health = 220
monster.maxHealth = 220
monster.race = "blood"
monster.corpse = 6011
monster.speed = 110
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
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 4,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = false,
	isPreyExclusive = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "I'll bring balance upon you!", yell = false },
	{ text = "Vihil Ealuel!", yell = false },
	{ text = "For the Daughter of the Stars!", yell = false },
	{ text = "Tha'shi Cenath!", yell = false },
	{ text = "Feel my wrath!", yell = false },
}

monster.loot = {
	{ id = 2815, chance = 24800 }, -- scroll
	{ name = "candlestick", chance = 1680 },
	{ name = "gold coin", chance = 29600, maxCount = 47 },
	{ name = "yellow gem", chance = 40 },
	{ name = "life crystal", chance = 776 },
	{ name = "wand of cosmic energy", chance = 928 },
	{ name = "elven amulet", chance = 1599 },
	{ name = "blank rune", chance = 14400 },
	{ name = "arrow", chance = 4800, maxCount = 3 },
	{ id = 3509, chance = 800 }, -- inkwell
	{ name = "sandals", chance = 760 },
	{ name = "green tunic", chance = 5600 },
	{ name = "melon", chance = 17600 },
	{ name = "bread", chance = 11200 },
	{ name = "grave flower", chance = 704 },
	{ name = "sling herb", chance = 4000 },
	{ name = "holy orchid", chance = 1680 },
	{ name = "strong mana potion", chance = 2400 },
	{ name = "health potion", chance = 3200 },
	{ name = "elvish talisman", chance = 8000 },
	{ name = "elven astral observer", chance = 6168 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -94 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -120, range = 7, shootEffect = CONST_ANI_ARROW, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ENERGYDAMAGE, minDamage = -80, maxDamage = -100, range = 7, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYHIT, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -120, maxDamage = -135, range = 7, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = false },
}

monster.defenses = {
	defense = 15,
	armor = 15,
	mitigation = 0.51,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 40, maxDamage = 60, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 50 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
