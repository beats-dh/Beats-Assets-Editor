local mType = Game.createMonsterType("Goshnar's Megalomania Blue")
local monster = {}

monster.name = "Goshnar's Megalomania"
monster.description = "Goshnar's Megalomania"
monster.experience = 3000000
monster.outfit = {
	lookType = 1337,
}

monster.health = 620000
monster.maxHealth = 620000
monster.race = "undead"
monster.corpse = 33889
monster.speed = 0
monster.manaCost = 0
monster.maxSummons = 4

monster.bosstiary = {
	bossRaceId = 1969,
	bossRace = RARITY_NEMESIS,
}

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 80,
	health = 10,
	damage = 10,
}

monster.events = {
	"GoshnarsHatredBuff",
	"MegalomaniaDeath",
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
	staticAttackChance = 80,
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
}

monster.loot = {
	{ name = "crystal coin", chance = 38500, minCount = 70, maxCount = 75 },
	{ id = 281, chance = 805 }, -- giant shimmering pearl (green)
	{ name = "giant sapphire", chance = 7000, maxCount = 1 },
	{ name = "giant topaz", chance = 7000, maxCount = 1 },
	{ name = "violet gem", chance = 4200, maxCount = 1 },
	{ name = "blue gem", chance = 7000, maxCount = 3 },
	{ id = 3039, chance = 7000, maxCount = 3 }, -- red gem
	{ name = "green gem", chance = 7000, maxCount = 3 },
	{ name = "yellow gem", chance = 7000, maxCount = 3 },
	{ name = "white gem", chance = 4200, maxCount = 3 },
	{ name = "dragon figurine", chance = 7000, maxCount = 1 },
	{ name = "bullseye potion", chance = 10500, minCount = 10, maxCount = 25 },
	{ name = "mastermind potion", chance = 10500, minCount = 10, maxCount = 25 },
	{ name = "berserk potion", chance = 10500, minCount = 10, maxCount = 25 },
	{ name = "ultimate mana potion", chance = 12600, minCount = 50, maxCount = 100 },
	{ name = "supreme health potion", chance = 12600, minCount = 50, maxCount = 100 },
	{ name = "ultimate spirit potion", chance = 12600, minCount = 50, maxCount = 100 },
	{ name = "figurine of malice", chance = 280 },
	{ name = "figurine of cruelty", chance = 280 },
	{ name = "figurine of hatred", chance = 280 },
	{ name = "figurine of greed", chance = 280 },
	{ name = "figurine of spite", chance = 280 },
	{ name = "figurine of megalomania", chance = 280 },
	{ name = "megalomania's skull", chance = 280 },
	{ name = "megalomania's essence", chance = 280 },
	{ name = "bag you desire", chance = 70 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -400, maxDamage = -2225 },
	{ name = "megalomania blue", interval = 6000, chance = 100, target = true },
	{ name = "combat", interval = 30000, chance = 100, type = COMBAT_LIFEDRAIN, minDamage = -1000, maxDamage = -1500, length = 8, radius = 5, spread = 0, effect = CONST_ME_PINK_ENERGY_SPARK, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 55,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

local intervalBetweenExecutions = 10000

local zone = Zone.getByName("boss.goshnar's-megalomania-purple")
local zonePositions = zone:getPositions()

mType.onThink = function(monsterCallback, interval)
	monsterCallback:onThinkGoshnarTormentCounter(interval, 36, intervalBetweenExecutions, SoulWarQuest.levers.goshnarsMegalomania.boss.position)
	monsterCallback:onThinkMegalomaniaWhiteTiles(interval, zonePositions, 8000)
	monsterCallback:goshnarsDefenseIncrease("cleansed-sanity-action")
end

mType.onDisappear = function(monster, creature)
	creature:removeGoshnarsMegalomaniaMonsters(zone)
end

mType:register(monster)
