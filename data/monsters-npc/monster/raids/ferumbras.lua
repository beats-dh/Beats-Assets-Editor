local mType = Game.createMonsterType("Ferumbras")
local monster = {}

monster.description = "Ferumbras"
monster.experience = 12000
monster.outfit = {
	lookType = 229,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 231,
	bossRace = RARITY_NEMESIS,
}

monster.health = 90000
monster.maxHealth = 90000
monster.race = "venom"
monster.corpse = 6078
monster.speed = 160
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
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 2,
	runHealth = 2500,
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
	maxSummons = 4,
	summons = {
		{ name = "Demon", chance = 12, interval = 3000, count = 4 },
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "NO ONE WILL STOP ME THIS TIME!", yell = true },
	{ text = "THE POWER IS MINE!", yell = true },
	{ text = "I returned from death and you dream about defeating me?", yell = false },
	{ text = "Witness the first seconds of my eternal world domination!", yell = false },
	{ text = "Even in my weakened state I will crush you all!", yell = false },
}

monster.loot = {
	{ id = 5903, chance = 70000, unique = true }, -- ferumbras' hat
	{ id = 3031, chance = 68600, maxCount = 184 }, -- gold coin
	{ id = 9058, chance = 52500, maxCount = 2 }, -- gold ingot
	{ id = 3422, chance = 18200, unique = true }, -- great shield
	{ id = 8075, chance = 18200 }, -- spellbook of lost souls
	{ id = 3360, chance = 16800 }, -- golden armor
	{ id = 3364, chance = 15400 }, -- golden legs
	{ id = 8074, chance = 15400 }, -- spellbook of mind control
	{ id = 8040, chance = 15400 }, -- velvet mantle
	{ id = 3420, chance = 14000 }, -- demon shield
	{ id = 8057, chance = 14000 }, -- divine plate
	{ id = 821, chance = 14000 }, -- magma legs
	{ id = 3442, chance = 14000 }, -- tempest shield
	{ id = 3010, chance = 12600 }, -- emerald bangle
	{ id = 823, chance = 12600 }, -- glacier kilt
	{ id = 822, chance = 12600 }, -- lightning legs
	{ id = 3439, chance = 12600 }, -- phoenix shield
	{ id = 8090, chance = 12600 }, -- spellbook of dark mysteries
	{ id = 812, chance = 12600 }, -- terra legs
	{ id = 8102, chance = 11200 }, -- emerald sword
	{ id = 7405, chance = 11200 }, -- havoc blade
	{ id = 7451, chance = 11200 }, -- shadow sceptre
	{ id = 3032, chance = 11200, maxCount = 100 }, -- small emerald
	{ id = 281, chance = 9800, maxCount = 5 }, -- giant shimmering pearl (green)
	{ id = 282, chance = 9800, maxCount = 5 }, -- giant shimmering pearl (brown)
	{ id = 3366, chance = 9800 }, -- magic plate armor
	{ id = 3414, chance = 9800 }, -- mastermind shield
	{ id = 7417, chance = 9800 }, -- runed sword
	{ id = 8076, chance = 9800 }, -- spellscroll of prophecies
	{ id = 7427, chance = 8400 }, -- chaos mace
	{ id = 8098, chance = 8400 }, -- demonwing axe
	{ id = 8041, chance = 8400 }, -- greenwood coat
	{ id = 3029, chance = 8400, maxCount = 98 }, -- small sapphire
	{ id = 3026, chance = 8400, maxCount = 88 }, -- white pearl
	{ id = 7407, chance = 7000 }, -- haunted blade
	{ id = 8096, chance = 7000 }, -- hellforged axe
	{ id = 7411, chance = 7000 }, -- ornamented axe
	{ id = 3033, chance = 7000, maxCount = 54 }, -- small amethyst
	{ id = 9057, chance = 7000, maxCount = 87 }, -- small topaz
	{ id = 7382, chance = 5600 }, -- demonrage sword
	{ id = 7422, chance = 5600 }, -- jade hammer
	{ id = 3035, chance = 5600, maxCount = 58 }, -- platinum coin
	{ id = 7423, chance = 5600 }, -- skullcrusher
	{ id = 5944, chance = 5600, maxCount = 9 }, -- soul orb
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -350 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_MANADRAIN, minDamage = -500, maxDamage = -700, range = 7, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_LIFEDRAIN, minDamage = -300, maxDamage = -450, length = 8, spread = 0, effect = CONST_ME_HITBYPOISON, target = false },
	{ name = "combat", interval = 2000, chance = 21, type = COMBAT_LIFEDRAIN, minDamage = -450, maxDamage = -500, radius = 6, effect = CONST_ME_POFF, target = false },
	-- poison
	{ name = "condition", type = CONDITION_POISON, interval = 2000, chance = 15, minDamage = -20, maxDamage = -40, range = 7, shootEffect = CONST_ANI_POISON, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_LIFEDRAIN, minDamage = -900, maxDamage = -1000, range = 4, radius = 3, effect = CONST_ME_DRAWBLOOD, target = false },
	-- energy damage
	{ name = "condition", type = CONDITION_ENERGY, interval = 2000, chance = 18, minDamage = -300, maxDamage = -400, radius = 6, effect = CONST_ME_ENERGYHIT, target = false },
	-- fire
	{ name = "condition", type = CONDITION_FIRE, interval = 3000, chance = 20, minDamage = -500, maxDamage = -600, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
}

monster.defenses = {
	defense = 120,
	armor = 100,
	--	mitigation = ???,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 900, maxDamage = 1500, effect = CONST_ME_MAGIC_GREEN, target = false },
	{ name = "invisible", interval = 4000, chance = 20, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 90 },
	{ type = COMBAT_EARTHDAMAGE, percent = 90 },
	{ type = COMBAT_FIREDAMAGE, percent = 90 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 20 },
	{ type = COMBAT_DEATHDAMAGE, percent = 5 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
