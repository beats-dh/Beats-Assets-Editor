local mType = Game.createMonsterType("Goggle Cake")
local monster = {}

monster.description = "a goggle cake"
monster.experience = 2430
monster.outfit = {
	lookType = 1740,
	lookHead = 0,
	lookBody = 10,
	lookLegs = 115,
	lookFeet = 72,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 2700
monster.maxHealth = 2700
monster.race = "candy"
monster.corpse = 48272
monster.speed = 200
monster.manaCost = 0

monster.raceId = 2534
monster.Bestiary = {
	class = "Magical",
	race = BESTY_RACE_FEY,
	toKill = 2500,
	FirstUnlock = 500,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Dessert Dungeons.",
}

monster.changeTarget = {
	interval = 5000,
	chance = 8,
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
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 3,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = false,
	canWalkOnPoison = false,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Give me your sweets! They are mine to devour!", yell = false },
	{ text = "Hm? Where... where are you now?", yell = false },
	{ text = "Hunger!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 80000, maxCount = 100 },
	{ name = "platinum coin", chance = 64496, maxCount = 10 },
	{ name = "small enchanted sapphire", chance = 5320, maxCount = 5 },
	{ name = "great mana potion", chance = 4760 },
	{ name = "combat knife", chance = 4760 },
	{ name = "rainbow quartz", chance = 2936, maxCount = 3 },
	{ name = "small sapphire", chance = 2912, maxCount = 2 },
	{ id = 3039, chance = 2216 }, -- red gem
	{ name = "spirit cloak", chance = 1480 },
	{ name = "gummy rotworm", chance = 1408 },
	{ name = "churro heart", chance = 1280 },
	{ id = 3606, chance = 840 }, -- egg
	{ name = "glacier amulet", chance = 768 },
	{ name = "milk chocolate coin", chance = 664, maxCount = 15 },
	{ name = "glacier robe", chance = 416 },
	{ name = "flour", chance = 416 },
	{ name = "cookie", chance = 344, maxCount = 2 },
	{ name = "epee", chance = 320 },
	{ name = "ice rapier", chance = 144 },
	{ name = "cream cake", chance = 96 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -350, maxDamage = -550 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_ICEDAMAGE, minDamage = -500, maxDamage = -750, range = 7, shootEffect = CONST_ANI_CAKE, effect = CONST_ME_CAKE, target = true },
	{ name = "combat", interval = 1800, chance = 18, type = COMBAT_ENERGYDAMAGE, minDamage = -300, maxDamage = -450, range = 7, radius = 4, shootEffect = CONST_ANI_CAKE, effect = CONST_ME_PIXIE_EXPLOSION, target = true },
	{ name = "gogglecakewave", interval = 2500, chance = 15, minDamage = -300, maxDamage = -450 },
}

monster.defenses = {
	defense = 38,
	armor = 38,
	mitigation = 0.99,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -5 },
	{ type = COMBAT_FIREDAMAGE, percent = -10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = 5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType.onThink = function(monster, interval) end

mType.onAppear = function(monster, creature) end

mType.onDisappear = function(monster, creature) end

mType.onMove = function(monster, creature, fromPosition, toPosition) end

mType.onSay = function(monster, creature, type, message) end

mType:register(monster)
