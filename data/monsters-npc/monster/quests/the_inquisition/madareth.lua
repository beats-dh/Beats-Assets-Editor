local mType = Game.createMonsterType("Madareth")
local monster = {}

monster.description = "Madareth"
monster.experience = 10000
monster.outfit = {
	lookType = 12,
	lookHead = 77,
	lookBody = 78,
	lookLegs = 80,
	lookFeet = 79,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"InquisitionBossDeath",
}

monster.bosstiary = {
	bossRaceId = 414,
	bossRace = RARITY_BANE,
}

monster.health = 75000
monster.maxHealth = 75000
monster.race = "fire"
monster.corpse = 7893
monster.speed = 165
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
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
	staticAttackChance = 85,
	targetDistance = 1,
	runHealth = 1200,
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
	{ text = "I am going to play with yourself!", yell = false },
	{ text = "Feel my wrath!", yell = false },
	{ text = "No one matches my battle prowess!", yell = false },
	{ text = "You will all die!", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 80000, maxCount = 150 }, -- gold coin
	{ id = 8899, chance = 47200 }, -- slightly rusted legs
	{ id = 8896, chance = 32000 }, -- slightly rusted armor
	{ id = 7443, chance = 26400 }, -- bullseye potion
	{ id = 239, chance = 24000 }, -- great health potion
	{ id = 7642, chance = 24000 }, -- great spirit potion
	{ id = 7440, chance = 22400 }, -- mastermind potion
	{ id = 7439, chance = 18400 }, -- berserk potion
	{ id = 238, chance = 16800 }, -- great mana potion
	{ id = 6299, chance = 15200 }, -- death ring
	{ id = 3067, chance = 15200 }, -- hailstorm rod
	{ id = 2950, chance = 15200 }, -- lute
	{ id = 3035, chance = 15200, maxCount = 26 }, -- platinum coin
	{ id = 3265, chance = 15200 }, -- two handed sword
	{ id = 7404, chance = 12800 }, -- assassin dagger
	{ id = 3092, chance = 12800 }, -- axe ring
	{ id = 7643, chance = 12800 }, -- ultimate health potion
	{ id = 8082, chance = 12800 }, -- underworld rod
	{ id = 3093, chance = 11200 }, -- club ring
	{ id = 6499, chance = 11200 }, -- demonic essence
	{ id = 7407, chance = 11200 }, -- haunted blade
	{ id = 2949, chance = 11200 }, -- lyre
	{ id = 7418, chance = 11200 }, -- nightmare blade
	{ id = 8084, chance = 11200 }, -- springsprout rod
	{ id = 2966, chance = 11200 }, -- war drum
	{ id = 3071, chance = 8800 }, -- wand of inferno
	{ id = 8094, chance = 8800 }, -- wand of voodoo
	{ id = 7416, chance = 7600 }, -- bloody edge
	{ id = 7449, chance = 7600 }, -- crystal sword
	{ id = 3098, chance = 7600 }, -- ring of healing
	{ id = 5954, chance = 5600, maxCount = 2 }, -- demon horn
	{ id = 3052, chance = 5600 }, -- life ring
	{ id = 7383, chance = 5600 }, -- relic sword
	{ id = 3053, chance = 5600 }, -- time ring
	{ id = 8092, chance = 5600 }, -- wand of starstorm
	{ id = 2958, chance = 5600 }, -- war horn
	{ id = 2948, chance = 5600 }, -- wooden flute
	{ id = 2965, chance = 3760 }, -- didgeridoo
	{ id = 3097, chance = 3760 }, -- dwarven ring
	{ id = 3284, chance = 3760 }, -- ice rapier
	{ id = 7386, chance = 3760 }, -- mercenary sword
	{ id = 3091, chance = 3760 }, -- sword ring
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -2000 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_ENERGYDAMAGE, minDamage = -180, maxDamage = -660, radius = 4, effect = CONST_ME_PURPLEENERGY, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -600, maxDamage = -850, length = 5, spread = 2, effect = CONST_ME_BLACKSMOKE, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -200, radius = 4, effect = CONST_ME_MAGIC_RED, target = true },
	{ name = "combat", interval = 2000, chance = 5, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -250, radius = 5, effect = CONST_ME_MAGIC_RED, target = true },
}

monster.defenses = {
	defense = 46,
	armor = 48,
	--	mitigation = ???,
	{ name = "combat", interval = 3000, chance = 14, type = COMBAT_HEALING, minDamage = 400, maxDamage = 900, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 99 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = -1 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 1 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 95 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
