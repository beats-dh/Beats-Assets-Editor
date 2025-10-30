local mType = Game.createMonsterType("Annihilon")
local monster = {}

monster.description = "Annihilon"
monster.experience = 15000
monster.outfit = {
	lookType = 12,
	lookHead = 3,
	lookBody = 9,
	lookLegs = 77,
	lookFeet = 77,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"InquisitionBossDeath",
}

monster.bosstiary = {
	bossRaceId = 418,
	bossRace = RARITY_BANE,
}

monster.health = 46500
monster.maxHealth = 46500
monster.race = "fire"
monster.corpse = 6068
monster.speed = 66
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
	{ text = "Flee as long as you can!", yell = false },
	{ text = "Annihilon's might will crush you all!", yell = false },
	{ text = "I am coming for you!", yell = false },
}

monster.loot = {
	{ name = "emerald bangle", chance = 16000 },
	{ name = "gold coin", chance = 80000, maxCount = 100 },
	{ name = "platinum coin", chance = 13333, maxCount = 30 },
	{ name = "violet gem", chance = 13333 },
	{ name = "yellow gem", chance = 16000 },
	{ name = "green gem", chance = 10000 },
	{ id = 3039, chance = 16000 }, -- red gem
	{ name = "blue gem", chance = 16000 },
	{ name = "halberd", chance = 16000 },
	{ name = "guardian halberd", chance = 16000 },
	{ name = "heavy mace", chance = 20000 },
	{ name = "mastermind shield", chance = 3333 },
	{ name = "guardian shield", chance = 6154 },
	{ name = "crown shield", chance = 8889 },
	{ name = "demon shield", chance = 3333 },
	{ name = "tower shield", chance = 7272 },
	{ name = "power bolt", chance = 13333, maxCount = 94 },
	{ name = "soul orb", chance = 16000, maxCount = 5 },
	{ name = "demon horn", chance = 10000, maxCount = 2 },
	{ name = "infernal bolt", chance = 16000, maxCount = 46 },
	{ name = "viper star", chance = 13333, maxCount = 70 },
	{ name = "assassin star", chance = 13333, maxCount = 50 },
	{ name = "diamond sceptre", chance = 5714 },
	{ name = "onyx flail", chance = 11428 },
	{ name = "demonbone", chance = 987 },
	{ name = "berserk potion", chance = 13333 },
	{ name = "mastermind potion", chance = 11428 },
	{ name = "great mana potion", chance = 8889 },
	{ name = "great health potion", chance = 11428 },
	{ id = 281, chance = 26666, maxCount = 2 }, -- giant shimmering pearl (green)
	{ name = "flaming arrow", chance = 16000, maxCount = 46 },
	{ name = "great spirit potion", chance = 11428 },
	{ name = "ultimate health potion", chance = 11428 },
	{ name = "lavos armor", chance = 1481 },
	{ name = "paladin armor", chance = 8000 },
	{ name = "obsidian truncheon", chance = 987 },
	{ id = 8894, chance = 987 }, -- heavily rusted armor
	{ id = 8896, chance = 40000 }, -- slightly rusted armor
	{ name = "gold ingot", chance = 16000 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -1707 },
	{ name = "combat", interval = 1000, chance = 11, type = COMBAT_DEATHDAMAGE, minDamage = 0, maxDamage = -600, length = 8, spread = 3, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -200, maxDamage = -700, radius = 4, effect = CONST_ME_ICEAREA, target = false },
	{ name = "combat", interval = 3000, chance = 18, type = COMBAT_PHYSICALDAMAGE, minDamage = -50, maxDamage = -255, radius = 5, effect = CONST_ME_GROUNDSHAKER, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -50, maxDamage = -600, radius = 6, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 60,
	--	mitigation = ???,
	{ name = "combat", interval = 1000, chance = 14, type = COMBAT_HEALING, minDamage = 400, maxDamage = 900, effect = CONST_ME_MAGIC_GREEN, target = false },
	{ name = "speed", interval = 1000, chance = 4, speedChange = 500, effect = CONST_ME_MAGIC_BLUE, target = false, duration = 7000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 95 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = -5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 95 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
