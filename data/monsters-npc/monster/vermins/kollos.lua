local mType = Game.createMonsterType("Kollos")
local monster = {}

monster.description = "a kollos"
monster.experience = 2400
monster.outfit = {
	lookType = 458,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 788
monster.Bestiary = {
	class = "Vermin",
	race = BESTY_RACE_VERMIN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 2,
	Locations = "Hive, Hive Outpost.",
}

monster.health = 3800
monster.maxHealth = 3800
monster.race = "venom"
monster.corpse = 13937
monster.speed = 115
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
	staticAttackChance = 95,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
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
	{ text = "Kropp!", yell = false },
	{ text = "Flzlzlzlzlzlzlz!", yell = false },
}

monster.loot = {
	{ name = "small ruby", chance = 6544, maxCount = 2 },
	{ name = "gold coin", chance = 39200, maxCount = 100 },
	{ name = "gold coin", chance = 40000, maxCount = 97 },
	{ name = "platinum coin", chance = 52800, maxCount = 3 },
	{ id = 3098, chance = 2616 }, -- ring of healing
	{ name = "steel boots", chance = 104 },
	{ name = "great mana potion", chance = 7160, maxCount = 4 },
	{ id = 281, chance = 2080 }, -- giant shimmering pearl (green)
	{ name = "ultimate health potion", chance = 3200, maxCount = 3 },
	{ name = "gold ingot", chance = 4128 },
	{ name = "kollos shell", chance = 12312 },
	{ name = "compound eye", chance = 12576 },
	{ name = "calopteryx cape", chance = 288 },
	{ name = "carapace shield", chance = 248 },
	{ name = "hive scythe", chance = 560 },
	{ name = "buggy backpack", chance = 368 },
	{ name = "tarsal arrow", chance = 8168, maxCount = 5 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -315 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -500, range = 7, radius = 3, shootEffect = CONST_ANI_EXPLOSION, effect = CONST_ME_EXPLOSIONHIT, target = true },
}

monster.defenses = {
	defense = 35,
	armor = 52,
	mitigation = 1.71,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 30 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -7 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
