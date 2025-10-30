local mType = Game.createMonsterType("Blood Priest")
local monster = {}

monster.description = "a blood priest"
monster.experience = 900
monster.outfit = {
	lookType = 553,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 961
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Drefia and Old Fortress.",
}

monster.health = 820
monster.maxHealth = 820
monster.race = "blood"
monster.corpse = 18945
monster.speed = 99
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
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "The Blood God is thirsty!", yell = false },
	{ text = "Give your blood to the Dark God!", yell = false },
}

monster.loot = {
	{ name = "small ruby", chance = 2808, maxCount = 2 },
	{ name = "gold coin", chance = 40000, maxCount = 100 },
	{ name = "gold coin", chance = 40000, maxCount = 71 },
	{ name = "boots of haste", chance = 96 },
	{ name = "skull staff", chance = 144 },
	{ name = "mystic turban", chance = 1736 },
	{ name = "white piece of cloth", chance = 2432 },
	{ name = "red piece of cloth", chance = 512 },
	{ name = "strong mana potion", chance = 4800 },
	{ name = "spellbook of warding", chance = 232 },
	{ name = "spellbook of mind control", chance = 144 },
	{ name = "underworld rod", chance = 376 },
	{ name = "book of necromantic rituals", chance = 10840 },
	{ id = 3039, chance = 704 }, -- red gem
	{ name = "lancet", chance = 11528 },
	{ name = "horoscope", chance = 7416 },
	{ name = "blood tincture in a vial", chance = 11568 },
	{ name = "incantation notes", chance = 11728 },
	{ name = "pieces of magic chalk", chance = 6216 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -80, condition = { type = CONDITION_POISON, totalDamage = 100, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -60, maxDamage = -100, range = 7, shootEffect = CONST_ANI_DEATH, effect = CONST_ME_SMALLCLOUDS, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_LIFEDRAIN, minDamage = -40, maxDamage = -60, radius = 4, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "combat", interval = 3000, chance = 10, type = COMBAT_MANADRAIN, minDamage = -80, maxDamage = -130, range = 1, length = 7, spread = 0, effect = CONST_ME_HITAREA, target = true },
	-- bleed
	{ name = "condition", type = CONDITION_BLEEDING, interval = 2000, chance = 5, minDamage = -160, maxDamage = -290, range = 1, radius = 1, target = true },
}

monster.defenses = {
	defense = 30,
	armor = 55,
	mitigation = 1.18,
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_HEALING, minDamage = 80, maxDamage = 120, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -8 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = -8 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = -8 },
	{ type = COMBAT_DEATHDAMAGE, percent = 50 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
