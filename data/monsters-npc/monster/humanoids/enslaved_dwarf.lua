local mType = Game.createMonsterType("Enslaved Dwarf")
local monster = {}

monster.description = "an enslaved dwarf"
monster.experience = 2700
monster.outfit = {
	lookType = 494,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 886
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Caves of the Lost and Lower Spike.",
}

monster.health = 3800
monster.maxHealth = 3800
monster.race = "blood"
monster.corpse = 16063
monster.speed = 135
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 70,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = true,
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
	{ text = "Bark!", yell = false },
	{ text = "Blood!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 40000, maxCount = 99 },
	{ name = "gold coin", chance = 40000, maxCount = 50 },
	{ name = "small emerald", chance = 8232, maxCount = 2 },
	{ name = "small amethyst", chance = 8544, maxCount = 2 },
	{ name = "platinum coin", chance = 80000, maxCount = 6 },
	{ id = 3092, chance = 1240 }, -- axe ring
	{ name = "war hammer", chance = 4040 },
	{ name = "warrior helmet", chance = 464 },
	{ name = "guardian shield", chance = 1840 },
	{ name = "tower shield", chance = 152 },
	{ name = "ancient shield", chance = 2952 },
	{ name = "brown mushroom", chance = 12120, maxCount = 2 },
	{ name = "iron ore", chance = 8856 },
	{ name = "titan axe", chance = 936 },
	{ name = "sapphire hammer", chance = 64 },
	{ name = "spiked squelcher", chance = 64 },
	{ name = "glorious axe", chance = 1552 },
	{ name = "great mana potion", chance = 5328, maxCount = 2 },
	{ name = "great health potion", chance = 6368 },
	{ name = "shiny stone", chance = 3728 },
	{ id = 12600, chance = 624 }, -- coal
	{ name = "green crystal shard", chance = 1400 },
	{ name = "green crystal splinter", chance = 2488 },
	{ name = "brown crystal splinter", chance = 4504, maxCount = 2 },
	{ name = "red crystal fragment", chance = 2952 },
	{ name = "drill bolt", chance = 2952, maxCount = 5 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -501 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -340, range = 7, shootEffect = CONST_ANI_LARGEROCK, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -250, range = 7, radius = 3, shootEffect = CONST_ANI_EXPLOSION, effect = CONST_ME_EXPLOSIONHIT, target = true },
	{ name = "drunk", interval = 2000, chance = 20, radius = 5, effect = CONST_ME_BLOCKHIT, target = false, duration = 6000 },
	{ name = "enslaved dwarf skill reducer 1", interval = 2000, chance = 5, target = false },
	{ name = "enslaved dwarf skill reducer 2", interval = 2000, chance = 5, target = false },
}

monster.defenses = {
	defense = 30,
	armor = 60,
	mitigation = 1.88,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 396, maxDamage = 478, effect = CONST_ME_MAGIC_GREEN, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -3 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 30 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
