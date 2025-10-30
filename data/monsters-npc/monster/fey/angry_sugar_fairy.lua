local mType = Game.createMonsterType("angry sugar fairy")
local monster = {}

monster.description = "a angry sugar fairy"
monster.experience = 2820
monster.outfit = {
	lookType = 1747,
	lookHead = 15,
	lookBody = 6,
	lookLegs = 53,
	lookFeet = 93,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2552
monster.Bestiary = {
	class = "Fey",
	race = BESTY_RACE_FEY,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Dessert Dungeons, Candy Carnival.",
}

monster.health = 3000
monster.maxHealth = 3000
monster.race = "undead"
monster.corpse = 48340
monster.speed = 120
monster.manaCost = 0

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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 4,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = false,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "No sweet sugar jewellery for you, intruder!" },
	{ text = "Don't trample the beautiful sprinkles! That makes me angry!" },
}

monster.loot = {
	{ name = "platinum coin", chance = 12303, minCount = 1, maxCount = 8 },
	{ id = 25691, chance = 2620 }, -- wild flower
	{ name = "green crystal splinter", chance = 2140 },
	{ name = "small enchanted sapphire", chance = 2320, minCount = 1, maxCount = 4 },
	{ name = "violet crystal shard", chance = 2240 },
	{ name = "wand of cosmic energy", chance = 2720 },
	{ name = "white pearl", chance = 2320, minCount = 1, maxCount = 2 },
	{ name = "prismatic quartz", chance = 2560 },
	{ name = "ruby necklace", chance = 2374 },
	{ name = "wafer paper flower", chance = 2050 },
	{ name = "spellbook of enlightenment", chance = 2314 },
	{ name = "butterfly ring", chance = 1965 },
	{ name = "milk chocolate coin", chance = 62 },
	{ id = 3098, chance = 1580 }, -- ring of healing
	{ name = "hibiscus dress", chance = 1180 },
	{ id = 3040, chance = 1930 }, -- gold nugget
	{ name = "small emerald", chance = 2320, minCount = 1, maxCount = 3 },
	{ name = "small ruby", chance = 2320, minCount = 1, maxCount = 3 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -300, maxDamage = -450 },
	{ name = "combat", interval = 2500, chance = 18, type = COMBAT_ENERGYDAMAGE, minDamage = -350, maxDamage = -550, range = 7, shootEffect = 62, effect = CONST_ME_PURPLEENERGY, target = true },
	{ name = "combat", interval = 3000, chance = 15, type = COMBAT_ICEDAMAGE, minDamage = -400, maxDamage = -550, range = 7, shootEffect = CONST_ANI_SMALLICE, effect = CONST_ME_ICEATTACK, target = true },
	{ name = "combat", interval = 3500, chance = 12, type = COMBAT_ENERGYDAMAGE, minDamage = -360, maxDamage = -550, length = 3, spread = 3, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ELECTRICALSPARK, target = true },
	{ name = "candyflosswave", interval = 2500, chance = 20, minDamage = -300, maxDamage = -450 },
}

monster.defenses = {
	defense = 37,
	armor = 37,
	mitigation = 1.10,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 40 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 40 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType.onThink = function(monster, interval) end

mType.onAppear = function(monster, creature)
	if monster:getType():isRewardBoss() then
		monster:setReward(true)
	end
end

mType.onDisappear = function(monster, creature) end

mType.onMove = function(monster, creature, fromPosition, toPosition) end

mType.onSay = function(monster, creature, type, message) end

mType:register(monster)
