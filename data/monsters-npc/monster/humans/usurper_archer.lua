local mType = Game.createMonsterType("Usurper Archer")
local monster = {}

monster.description = "an usurper archer"
monster.experience = 6800
monster.outfit = {
	lookType = 1316,
	lookHead = 76,
	lookBody = 57,
	lookLegs = 76,
	lookFeet = 95,
	lookAddons = 2,
	lookMount = 0,
}

monster.raceId = 1973
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Bounac, the Order of the Lion settlement.",
}

monster.health = 7300
monster.maxHealth = 7300
monster.race = "blood"
monster.corpse = 33981
monster.speed = 125
monster.manaCost = 0

monster.faction = FACTION_LIONUSURPERS
monster.enemyFactions = { FACTION_PLAYER, FACTION_LION }

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

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{ name = "platinum coin", chance = 80000, maxCount = 5 },
	{ name = "ultimate health potion", chance = 60108, maxCount = 3 },
	{ name = "meat", chance = 38162 },
	{ name = "broken longbow", chance = 11676 },
	{ name = "lion cloak patch", chance = 8108 },
	{ name = "black pearl", chance = 7027 },
	{ name = "warrior helmet", chance = 7027 },
	{ name = "mino shield", chance = 6811 },
	{ name = "silver brooch", chance = 6270 },
	{ name = "knife", chance = 6162 },
	{ name = "lion crest", chance = 5514 },
	{ id = 281, chance = 4541 }, -- giant shimmering pearl (green)
	{ name = "gemmed figurine", chance = 3351 },
	{ name = "white pearl", chance = 2811 },
	{ name = "glacier shoes", chance = 1946 },
	{ name = "knight armor", chance = 1514 },
	{ name = "coral brooch", chance = 1406 },
	{ name = "assassin dagger", chance = 1298 },
	{ name = "ornate crossbow", chance = 757 },
	{ name = "emerald bangle", chance = 649 },
	{ name = "wood cape", chance = 324 },
	{ name = "elvish bow", chance = 216 },
}

monster.attacks = {
	{ name = "combat", interval = 2000, chance = 100, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -430, range = 7, shootEffect = CONST_ANI_BURSTARROW, target = true },
	{ name = "combat", interval = 6000, chance = 12, type = COMBAT_DEATHDAMAGE, minDamage = -160, maxDamage = -485, range = 7, shootEffect = CONST_ANI_SMALLHOLY, target = true },
	{ name = "combat", interval = 4000, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -160, maxDamage = -545, range = 7, effect = CONST_ME_MORTAREA, shootEffect = CONST_ANI_SUDDENDEATH, target = true },
	{ name = "combat", interval = 4000, chance = 10, type = COMBAT_ICEDAMAGE, minDamage = -150, maxDamage = -425, radius = 3, effect = CONST_ME_ICEAREA, target = true },
}

monster.defenses = {
	defense = 50,
	armor = 82,
	mitigation = 2.31,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = -20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
