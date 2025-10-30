local mType = Game.createMonsterType("Earl Osam")
local monster = {}

monster.description = "Earl Osam"
monster.experience = 55000
monster.outfit = {
	lookType = 1223,
	lookHead = 113,
	lookBody = 0,
	lookLegs = 79,
	lookFeet = 95,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"EarlOsamTransform",
	"graveDangerBossDeath",
}

monster.health = 150000
monster.maxHealth = 150000
monster.race = "venom"
monster.corpse = 31599
monster.speed = 165
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.bosstiary = {
	bossRaceId = 1757,
	bossRace = RARITY_ARCHFOE,
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

monster.summon = {}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "I ... will ... get ... you ... all!", yell = false },
	{ text = "I ... will ... rise ... again!", yell = false },
}

monster.loot = {
	{ name = "platinum coin", minCount = 1, maxCount = 5, chance = 70000 },
	{ name = "crystal coin", minCount = 0, maxCount = 2, chance = 35000 },
	{ name = "supreme health potion", minCount = 0, maxCount = 6, chance = 24500 },
	{ name = "ultimate mana potion", minCount = 0, maxCount = 20, chance = 22400 },
	{ name = "ultimate spirit potion", minCount = 0, maxCount = 20, chance = 22400 },
	{ name = "bullseye potion", minCount = 0, maxCount = 10, chance = 8400 },
	{ name = "mastermind potion", minCount = 0, maxCount = 10, chance = 8400 },
	{ name = "berserk potion", minCount = 0, maxCount = 10, chance = 8400 },
	{ name = "transcendence potion", minCount = 0, maxCount = 10, chance = 8400 },
	{ name = "piece of draconian steel", minCount = 0, maxCount = 3, chance = 6300 },
	{ id = 3039, minCount = 0, maxCount = 2, chance = 8400 }, -- red gem
	{ name = "silver token", minCount = 0, maxCount = 2, chance = 6650 },
	{ id = 23542, chance = 3640 }, -- collar of blue plasma
	{ id = 23544, chance = 3640 }, -- collar of red plasma
	{ id = 23529, chance = 3500 }, -- ring of blue plasma
	{ id = 23533, chance = 3500 }, -- ring of red plasma
	{ name = "warrior helmet", chance = 7700 },
	{ name = "guardian axe", chance = 4480 },
	{ name = "gold ingot", minCount = 0, maxCount = 1, chance = 7000 },
	{ name = "young lich worm", chance = 4060 },
	{ name = "embrace of nature", chance = 1120 },
	{ name = "token of love", chance = 840 },
	{ name = "rotten heart", chance = 1190 },
	{ name = "terra helmet", chance = 511 },
	{ name = "final judgement", chance = 308 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -1000, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_ICEDAMAGE, minDamage = -400, maxDamage = -1000, length = 7, spread = 0, effect = CONST_ME_ICEATTACK, target = false },
	{ name = "ice chain", interval = 2500, chance = 25, minDamage = -260, maxDamage = -360, range = 3, target = true },
	{ name = "combat", interval = 3500, chance = 37, type = COMBAT_EARTHDAMAGE, minDamage = -400, maxDamage = -1000, length = 7, spread = 2, effect = CONST_ME_POISONAREA, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 78,
	--	mitigation = ???,
	{ name = "combat", interval = 2000, chance = 35, type = COMBAT_HEALING, minDamage = 350, maxDamage = 550, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 50 },
	{ type = COMBAT_FIREDAMAGE, percent = -10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 50 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
