local mType = Game.createMonsterType("Ahau")
local monster = {}

monster.description = "Ahau"
monster.experience = 17500
monster.outfit = {
	lookType = 1591,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"iksupanBossesDeath",
}

monster.bosstiary = {
	bossRaceId = 2346,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 9000
monster.maxHealth = 9000
monster.race = "blood"
monster.corpse = 42069
monster.speed = 350
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 0,
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
	{ text = "WAAAHNGH!!!", yell = true },
	{ text = "Awrrrgh!", yell = false },
	{ text = "IKSPUTUTU!!", yell = true },
	{ text = "Hwaaarrrh!!!", yell = false },
	{ text = "Wraaahgh?!", yell = false },
	{ text = "AAAAAH!!", yell = true },
}

monster.loot = {
	{ name = "gold coin", chance = 70000, maxCount = 100 },
	{ name = "the living idol of tukh", chance = 70000 },
	{ name = "rotten feather", chance = 35000 },
	{ name = "great health potion", chance = 28000, maxCount = 5 },
	{ name = "great spirit potion", chance = 17871, maxCount = 1 },
	{ name = "great mana potion", chance = 23828, maxCount = 5 },
	{ name = "ritual tooth", chance = 23086 },
	{ name = "diamond", chance = 3724, maxCount = 8 },
	{ name = "amber with a bug", chance = 2233 },
	{ name = "amber", chance = 3724 },
	{ id = 23533, chance = 2450 }, --ring of red plasma
	{ id = 23531, chance = 2450 }, --ring of green plasma
	{ id = 23529, chance = 2450 }, --ring of blue plasma
	{ id = 23544, chance = 2450 }, --collar of red plasma
	{ id = 23542, chance = 2450 }, --collar of blue plasma
	{ id = 23543, chance = 2450 }, --collar of green plasma
	{ name = "broken iks headpiece", chance = 700 },
	{ name = "broken macuahuitl", chance = 700 },
	{ name = "broken iks faulds", chance = 700 },
	{ name = "broken iks cuirass", chance = 700 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -456, condition = { type = CONDITION_POISON, startDamage = 75, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_EARTHDAMAGE, minDamage = -354, maxDamage = -422, range = 1, radius = 1, target = true, effect = CONST_ME_GREEN_RINGS },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -411, maxDamage = -511, length = 5, spread = 0, effect = CONST_ME_HITBYFIRE },
	{ name = "extended fire chain", interval = 2000, chance = 10, minDamage = -230, maxDamage = -275, range = 7 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_EARTHDAMAGE, minDamage = -419, maxDamage = -570, radius = 4, target = false, effect = CONST_ME_STONES },
	{ name = "boulder ring", interval = 2000, chance = 20, minDamage = -468, maxDamage = -493 },
}

monster.defenses = {
	defense = 64,
	armor = 0,
	--	mitigation = ???,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
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
