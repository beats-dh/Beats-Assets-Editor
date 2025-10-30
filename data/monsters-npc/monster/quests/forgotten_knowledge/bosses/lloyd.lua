local mType = Game.createMonsterType("Lloyd")
local monster = {}

monster.description = "Lloyd"
monster.experience = 50000
monster.outfit = {
	lookType = 940,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"ForgottenKnowledgeBossDeath",
	"LloydPrepareDeath",
}

monster.bosstiary = {
	bossRaceId = 1329,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 64000
monster.maxHealth = 64000
monster.race = "venom"
monster.corpse = 24927
monster.speed = 200
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 20,
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
	runHealth = 1,
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
	{ name = "gold coin", chance = 70000, maxCount = 329 },
	{ name = "platinum coin", chance = 70000, maxCount = 35 },
	{ id = 3100, chance = 70000 }, -- ring of healing
	{ name = "wand of starstorm", chance = 70000 },
	{ name = "mastermind potion", chance = 70000 },
	{ name = "violet crystal shard", chance = 50253, maxCount = 5 },
	{ name = "blue crystal shard", chance = 48461, maxCount = 5 },
	{ name = "great spirit potion", chance = 43078, maxCount = 10 },
	{ name = "ultimate health potion", chance = 39487, maxCount = 10 },
	{ name = "green crystal shard", chance = 39487, maxCount = 5 },
	{ name = "great mana potion", chance = 32305, maxCount = 10 },
	{ name = "luminous orb", chance = 28721 },
	{ id = 23542, chance = 26922 }, -- collar of blue plasma
	{ name = "gold token", chance = 21539 },
	{ id = 282, chance = 21539 }, -- giant shimmering pearl
	{ name = "rusted armor", chance = 19747 },
	{ id = 3039, chance = 19747 }, -- red gem
	{ name = "small emerald", chance = 17948, maxCount = 10 },
	{ name = "small amethyst", chance = 17948, maxCount = 12 },
	{ name = "silver token", chance = 17948 },
	{ name = "small topaz", chance = 14357, maxCount = 10 },
	{ name = "small ruby", chance = 12565, maxCount = 18 },
	{ name = "spellbook of warding", chance = 10766 },
	{ name = "yellow gem", chance = 8974 },
	{ name = "small diamond", chance = 7182, maxCount = 10 },
	{ name = "white piece of cloth", chance = 7182, maxCount = 3 },
	{ name = "piece of hell steel", chance = 7182, maxCount = 3 },
	{ name = "blue gem", chance = 7182 },
	{ name = "green gem", chance = 7182 },
	{ name = "lightning legs", chance = 5383 },
	{ name = "violet gem", chance = 5383 },
	{ name = "spellweaver's robe", chance = 3591 },
	{ name = "demon helmet", chance = 3591 },
	{ name = "boots of haste", chance = 1792 },
	{ id = 24959, chance = 350, unique = true }, -- part of a rune
	{ name = "pillow backpack", chance = 179 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -200, maxDamage = -1400 },
	{ name = "combat", interval = 2000, chance = 12, type = COMBAT_ENERGYDAMAGE, minDamage = -330, maxDamage = -660, length = 6, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "lloyd wave", interval = 2000, chance = 12, minDamage = -430, maxDamage = -560, target = false },
	{ name = "lloyd wave2", interval = 2000, chance = 12, minDamage = -230, maxDamage = -460, target = false },
	{ name = "lloyd wave3", interval = 2000, chance = 12, minDamage = -430, maxDamage = -660, target = false },
}

monster.defenses = {
	defense = 55,
	armor = 55,
	mitigation = 2.35,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 180, maxDamage = 250, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 50 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
