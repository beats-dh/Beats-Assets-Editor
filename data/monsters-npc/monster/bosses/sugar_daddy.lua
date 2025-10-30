local mType = Game.createMonsterType("Sugar Daddy")
local monster = {}
monster.description = "a sugar daddy"
monster.experience = 15550
monster.outfit = {
	lookType = 1764,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 94,
	lookAddons = 2,
	lookMount = 0,
}
monster.health = 9500
monster.maxHealth = 9500
monster.corpse = 48417
monster.race = "candy"
monster.speed = 165
monster.manaCost = 0
monster.bosstiary = {
	bossRaceId = 2562,
	bossRace = RARITY_BANE,
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
	rewardBoss = true,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	critChance = 10,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
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
}
monster.loot = {
	{ id = 3035, chance = 70000, minCount = 1, maxCount = 11 }, -- Platinum Coin
	{ id = 3029, chance = 70000, minCount = 1, maxCount = 4 }, -- Small Sapphire
	{ id = 3039, chance = 6588, minCount = 1, maxCount = 2 }, -- Red Gem
	{ id = 48249, chance = 3809, minCount = 1, maxCount = 64 }, -- Milk Chocolate Coin
	{ id = 48250, chance = 3191, minCount = 1, maxCount = 64 }, -- Dark Chocolate Coin
	{ id = 48255, chance = 4756, minCount = 1, maxCount = 1 }, -- Lime Tart
	{ id = 48254, chance = 4523, minCount = 1, maxCount = 1 }, -- Churro Heart
	{ id = 48253, chance = 3823, minCount = 1, maxCount = 2 }, -- Beijinho
	{ id = 48252, chance = 3823, minCount = 1, maxCount = 2 }, -- Brigadeiro
	{ id = 45642, chance = 1023, minCount = 1, maxCount = 1 }, -- Ring of Temptation
	{ id = 32769, chance = 412, minCount = 1, maxCount = 2 }, -- White Gem
	{ id = 48256, chance = 3823, minCount = 1, maxCount = 1 }, -- Pastry Dragon
	{ id = 45644, chance = 595, minCount = 1, maxCount = 1 }, -- Candy-Coated Quiver
	{ id = 45643, chance = 595, minCount = 1, maxCount = 1 }, -- Biscuit Barrier
	{ id = 45639, chance = 595, minCount = 1, maxCount = 1 }, -- Cocoa Grimoire
	{ id = 3031, chance = 70000, minCount = 15, maxCount = 94 }, -- Gold Coins
	{ id = 45641, chance = 1155, minCount = 1, maxCount = 1 }, -- Candy Necklace
	{ id = 45640, chance = 595, minCount = 1, maxCount = 1 }, -- Creamy Grimoire
	{ id = 48264, chance = 875, minCount = 1, maxCount = 1 }, -- Peppermint Backpack
	{ id = 60080, chance = 25000 }, -- boss token
}
monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -450, maxDamage = -700 },
	{ name = "sugar daddy wave", interval = 1500, chance = 25, minDamage = -700, maxDamage = -1200 },
	{ name = "sugar daddy explosion", interval = 2000, chance = 20, minDamage = -650, maxDamage = -950 },
}
monster.defenses = {
	defense = 50,
	armor = 50,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 250, maxDamage = 300, radius = 5, effect = CONST_ME_HEART_CIRCLE, target = false },
}
monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 5 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
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
