local mType = Game.createMonsterType("Foam Stalker")
local monster = {}

monster.description = "a foam stalker"
monster.experience = 3120
monster.outfit = {
	lookType = 1562,
}

monster.raceId = 2259
monster.Bestiary = {
	class = "Elemental",
	race = BESTY_RACE_ELEMENTAL,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Great Pearl Fan Reef",
}

monster.health = 4500
monster.maxHealth = 4500
monster.race = "blood"
monster.corpse = 39344
monster.speed = 180
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
	chance = 0,
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
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 2,
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
	{ text = "splash", yell = false },
	{ text = "gurgle", yell = false },
	{ text = "dribble", yell = false },
}

monster.loot = {
	{ name = "platinum coin", chance = 80000, maxCount = 50 },
	{ name = "halberd", chance = 8820 },
	{ name = "strong mana potion", chance = 7782 },
	{ name = "orichalcum pearl", chance = 7782 },
	{ name = "spike sword", chance = 6641 },
	{ name = "combat knife", chance = 5603 },
	{ name = "flotsam", chance = 5499 },
	{ name = "white pearl", chance = 5188 },
	{ id = 3130, chance = 5084 }, -- twigs
	{ id = 3289, chance = 5084 }, -- staff
	{ name = "remains of a fish", chance = 4773 },
	{ name = "glacier shoes", chance = 4566 },
	{ name = "coral branch", chance = 3943 },
	{ name = "soul orb", chance = 3943 },
	{ id = 3027, chance = 3735 }, -- black pearl
	{ name = "small diamond", chance = 3113 },
	{ name = "small emerald", chance = 2594, maxCount = 2 },
	{ id = 281, chance = 1764 }, -- giant shimmering pearl (green)
	{ id = 50152, chance = 816 }, -- collar of orange plasma
	{ name = "terra boots", chance = 4060 },
	{ name = "mercenary sword", chance = 3334 },
	{ name = "knight legs", chance = 2919 },
	{ name = "violet gem", chance = 2711 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -100, maxDamage = -300 },
	{ name = "foamsplash", interval = 5000, chance = 50, minDamage = -100, maxDamage = -300 },
	{ name = "combat", interval = 2500, chance = 35, type = COMBAT_ICEDAMAGE, minDamage = -100, maxDamage = -300, length = 6, spread = 0, effect = CONST_ME_LOSEENERGY },
	{ name = "combat", interval = 2000, chance = 45, type = COMBAT_ICEDAMAGE, minDamage = -100, maxDamage = -300, range = 4, radius = 1, target = true, effect = CONST_ME_ICEATTACK, shootEffect = CONST_ANI_ICE },
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_ICEDAMAGE, minDamage = -100, maxDamage = -300, radius = 4, target = false, effect = CONST_ME_ICEAREA },
}

monster.defenses = {
	defense = 64,
	armor = 64,
	mitigation = 1.74,
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_HEALING, minDamage = 80, maxDamage = 113 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -30 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 80 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
