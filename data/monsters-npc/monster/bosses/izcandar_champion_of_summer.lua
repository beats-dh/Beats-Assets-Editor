local mType = Game.createMonsterType("Izcandar Champion of Summer")
local monster = {}

monster.description = "Izcandar Champion of Summer"
monster.experience = 6900
monster.outfit = {
	lookType = 1137,
	lookHead = 43,
	lookBody = 78,
	lookLegs = 43,
	lookFeet = 43,
	lookAddons = 3,
	lookMount = 0,
}

monster.health = 130000
monster.maxHealth = 130000
monster.race = "blood"
monster.corpse = 25151
monster.speed = 200
monster.manaCost = 0

monster.events = {
	"dreamCourtsDeath",
	"izcandarThink",
}

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
	{ text = "Dream or nightmare?", yell = false },
}

monster.loot = {
	{ name = "Energy Bar", chance = 70000 },
	{ name = "Gold Token", chance = 70000, maxCount = 2 },
	{ name = "Piggy Bank", chance = 70000 },
	{ name = "Platinum Coin", chance = 70000, maxCount = 5 },
	{ name = "Silver Token", chance = 70000, maxCount = 2 },
	{ name = "Mysterious Remains", chance = 70000 },
	{ name = "Yellow Gem", chance = 48461, maxCount = 2 },
	{ name = "Ultimate Spirit Potion", chance = 43078, maxCount = 20 },
	{ name = "Supreme Health Potion", chance = 37695, maxCount = 20 },
	{ name = "Ultimate Mana Potion", chance = 37695, maxCount = 14 },
	{ id = 3039, chance = 32305 }, -- red gem
	{ id = 23529, chance = 26922 }, -- Ring of Blue Plasma
	{ name = "Chaos Mace", chance = 16156 },
	{ name = "Huge Chunk of Crude Iron", chance = 21544 },
	{ name = "Bullseye Potion", chance = 16156, maxCount = 10 },
	{ name = "Summerblade", chance = 70, unique = true },
	{ id = 281, chance = 16156 }, -- giant shimmering pearl
	{ name = "Royal Star", chance = 16156, maxCount = 100 },
	{ name = "Blue Gem", chance = 10766 },
	{ name = "Mastermind Potion", chance = 10766, maxCount = 10 },
	{ name = "Skull Staff", chance = 10766 },
	{ name = "Berserk Potion", chance = 5383, maxCount = 10 },
	{ id = 23543, chance = 5383 }, -- Collar of Green Plasma
	{ id = 23544, chance = 5383 }, -- Collar of Red Plasma
	{ name = "Crystal Coin", chance = 5383, maxCount = 2 },
	{ name = "Ornate Locket", chance = 5383 },
	{ name = "Pomegranate", chance = 5383 },
	{ id = 26189, chance = 5383 }, -- Ring of Red Plasma
	{ name = "Ring of the Sky", chance = 5383 },
	{ name = "Izcandar's Snow Globe", chance = 1050 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -320, maxDamage = -750 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ICEDAMAGE, minDamage = -500, maxDamage = -850, radius = 6, effect = false, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DROWNDAMAGE, minDamage = -300, maxDamage = -850, length = 8, spread = 3, effect = false, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_MANADRAIN, minDamage = -444, maxDamage = -850, radius = 4, effect = false, shootEffect = CONST_ANI_SUDDENDEATH, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -410, maxDamage = -850, length = 9, effect = false, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -410, maxDamage = -850, length = 9, effect = false, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_ICEDAMAGE, minDamage = -410, maxDamage = -850, length = 9, effect = false, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = -410, maxDamage = -850, radius = 3, shootEffect = CONST_ANI_EARTH, effect = false, target = false },
}

monster.defenses = {
	defense = 76,
	armor = 76,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 310, maxDamage = 640, effect = CONST_ME_REDSPARK },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "invisible", condition = true },
	{ type = "fire", condition = true },
}

mType:register(monster)
