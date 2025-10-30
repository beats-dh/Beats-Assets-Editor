local mType = Game.createMonsterType("Inkwing")
local monster = {}

monster.description = "Inkwing"
monster.experience = 17500
monster.outfit = {
	lookType = 1850,
	lookHead = 19,
	lookBody = 95,
	lookLegs = 68,
	lookFeet = 86,
	lookAddons = 3,
	lookMount = 0,
}

monster.health = 12000
monster.maxHealth = 12000
monster.race = "undead"
monster.corpse = 51509
monster.speed = 120
monster.manaCost = 0

monster.events = {
	"BetweenTheLinesMiniBossFirstKillRewards"
}

monster.changeTarget = { interval = 4000, chance = 10 }

monster.bosstiary = {
	bossRaceId = 2679,
	bossRace = RARITY_BANE,
}

monster.strategiesTarget = { nearest = 100 }

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

monster.light = { level = 0, color = 0 }

monster.summon = {
	maxSummons = 1,
	summons = {
		{ name = "ink splash", chance = 10, interval = 2000, count = 4 },
	},
}

monster.voices = { interval = 5000, chance = 10 }

monster.loot = {
	{ name = "platinum coin", minCount = 0, maxCount = 18, chance = 50000 },
	{ name = "book with a dragon", chance = 12000 },
	{ name = "dragon ham", minCount = 0, maxCount = 2, chance = 15000 },
	{ name = "strong health potion", chance = 15000 },
	{ name = "strong mana potion", chance = 15000 },
	{ name = "wand of dragonbreath", chance = 9000 },
	{ name = "blue gem", chance = 8000 },
	{ id = 3039, chance = 5000 }, -- red gem
	{ name = "yellow gem", chance = 6000 },
	{ name = "dragon necklace", chance = 5000 },
	{ name = "dragon shield", chance = 5000 },
	{ name = "blank imbuement scroll", chance = 3500 },
	{ name = "dragon slayer", chance = 3000 },
	{ name = "proficiency catalyst", chance = 500 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -300, maxDamage = -500, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", interval = 2600, chance = 25, type = COMBAT_ICEDAMAGE, minDamage = -300, maxDamage = -500, length = 7, spread = 3, effect = CONST_ME_ICEATTACK, target = false },
	{ name = "combat", interval = 2500, chance = 22, type = COMBAT_DEATHDAMAGE, minDamage = -300, maxDamage = -500, range = 6, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = true },
}

monster.defenses = {
	defense = 25,
	armor = 45,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
