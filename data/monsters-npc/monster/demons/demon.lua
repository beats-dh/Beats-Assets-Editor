local mType = Game.createMonsterType("Demon")
local monster = {}

monster.description = "a demon"
monster.experience = 6000
monster.outfit = {
	lookType = 35,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 35
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Hero Cave, Ferumbras' Citadel, Goroma, Ghostlands Warlock area unreachable, Liberty Bay hidden underground passage unreachable, Razachai, deep in Pits of Inferno (found in every throneroom except Verminor's), deep Formorgar Mines, Demon Forge, Alchemist Quarter, Magician Quarter, Chyllfroest, Oramond Dungeon, Abandoned Sewers, Hell Hub and Halls of Ascension.",
}

monster.health = 8200
monster.maxHealth = 8200
monster.race = "fire"
monster.corpse = 5995
monster.speed = 128
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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 70,
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

monster.summon = {
	maxSummons = 1,
	summons = {
		{ name = "fire elemental", chance = 10, interval = 2000, count = 1 },
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Your soul will be mine!", yell = false },
	{ text = "CHAMEK ATH UTHUL ARAK!", yell = true },
	{ text = "I SMELL FEEEEAAAAAR!", yell = true },
	{ text = "Your resistance is futile!", yell = false },
	{ text = "MUHAHAHAHA!", yell = true },
}

monster.loot = {
	{ name = "gold coin", chance = 80000, maxCount = 200 },
	{ name = "platinum coin", chance = 80000, minCount = 3, maxCount = 6 },
	{ name = "purple tome", chance = 952 },
	{ name = "small emerald", chance = 9032, maxCount = 5 },
	{ name = "small amethyst", chance = 6968, maxCount = 5 },
	{ name = "small ruby", chance = 7448, maxCount = 5 },
	{ name = "small topaz", chance = 8400, maxCount = 5 },
	{ id = 3039, chance = 2216 }, -- red gem
	{ name = "demonic essence", chance = 17264 },
	{ name = "talon", chance = 2536 },
	{ name = "might ring", chance = 952 },
	{ id = 3049, chance = 2696 }, -- stealth ring
	{ name = "platinum amulet", chance = 560 },
	{ name = "orb", chance = 2280 },
	{ name = "gold ring", chance = 1112 },
	{ id = 3098, chance = 2096 }, -- ring of healing
	{ name = "giant sword", chance = 2056 },
	{ name = "ice rapier", chance = 2224 },
	{ name = "golden sickle", chance = 792 },
	{ name = "fire axe", chance = 3800 },
	{ name = "devil helmet", chance = 792 },
	{ name = "golden legs", chance = 320 },
	{ name = "magic plate armor", chance = 320 },
	{ name = "mastermind shield", chance = 160 },
	{ name = "demon shield", chance = 584 },
	{ name = "fire mushroom", chance = 16160, maxCount = 6 },
	{ name = "demon horn", chance = 16632 },
	{ name = "assassin star", chance = 13464, maxCount = 10 },
	{ name = "demonrage sword", chance = 56 },
	{ id = 7393, chance = 72 }, -- demon trophy
	{ name = "great mana potion", chance = 20120, maxCount = 3 },
	{ name = "ultimate health potion", chance = 16160, maxCount = 3 },
	{ name = "great spirit potion", chance = 20280, maxCount = 3 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -520 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -120, range = 7, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -150, maxDamage = -250, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "firefield", interval = 2000, chance = 10, range = 7, radius = 1, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -300, maxDamage = -490, length = 8, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ENERGYDAMAGE, minDamage = -210, maxDamage = -300, range = 1, shootEffect = CONST_ANI_ENERGY, target = true },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -700, radius = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 30000 },
}

monster.defenses = {
	defense = 55,
	armor = 44,
	mitigation = 1.74,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 180, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 25 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 50 },
	{ type = COMBAT_EARTHDAMAGE, percent = 40 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = -12 },
	{ type = COMBAT_HOLYDAMAGE, percent = -12 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
