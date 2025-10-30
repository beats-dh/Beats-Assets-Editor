local mType = Game.createMonsterType("Blightwalker")
local monster = {}

monster.description = "a blightwalker"
monster.experience = 6400
monster.outfit = {
	lookType = 246,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 298
monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_UNDEAD,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Pits of Inferno, Edron (In the Vats during The Inquisition Quest), Roshamuul Prison, Grounds of Undeath.",
}

monster.health = 8100
monster.maxHealth = 8100
monster.race = "undead"
monster.corpse = 6353
monster.speed = 175
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 80,
	health = 10,
	damage = 10,
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
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 800,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
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
	{ text = "I can see you decaying!", yell = false },
	{ text = "Let me taste your mortality!", yell = false },
	{ text = "Your lifeforce is waning!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 80000, maxCount = 197 },
	{ name = "platinum coin", chance = 80000, maxCount = 5 },
	{ name = "amulet of loss", chance = 96 },
	{ name = "gold ring", chance = 1496 },
	{ name = "hailstorm rod", chance = 8000 },
	{ name = "garlic necklace", chance = 1640 },
	{ name = "blank rune", chance = 21000, maxCount = 2 },
	{ name = "golden sickle", chance = 280 },
	{ name = "skull staff", chance = 1216 },
	{ name = "scythe", chance = 2400 },
	{ name = "bunch of wheat", chance = 40000 },
	{ name = "soul orb", chance = 18976 },
	{ id = 6299, chance = 1128 }, -- death ring
	{ name = "demonic essence", chance = 22400 },
	{ name = "assassin star", chance = 4720, maxCount = 10 },
	{ name = "great mana potion", chance = 25088, maxCount = 3 },
	{ id = 281, chance = 3560 }, -- giant shimmering pearl (green)
	{ id = 282, chance = 3560 }, -- giant shimmering pearl (brown)
	{ name = "seeds", chance = 3440 },
	{ name = "terra mantle", chance = 840 },
	{ name = "terra legs", chance = 2000 },
	{ name = "ultimate health potion", chance = 11776, maxCount = 2 },
	{ name = "gold ingot", chance = 4216 },
	{ name = "bundle of cursed straw", chance = 12000 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -490 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = -220, maxDamage = -405, range = 7, radius = 1, shootEffect = CONST_ANI_POISON, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_LIFEDRAIN, minDamage = -65, maxDamage = -135, radius = 4, effect = CONST_ME_MAGIC_GREEN, target = false },
	{ name = "blightwalker curse", interval = 2000, chance = 15, target = false },
	{ name = "speed", interval = 2000, chance = 10, speedChange = -300, range = 7, shootEffect = CONST_ANI_POISON, target = true, duration = 15000 },
}

monster.defenses = {
	defense = 50,
	armor = 63,
	mitigation = 1.18,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 50 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = -30 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
