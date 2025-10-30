local mType = Game.createMonsterType("Mushroom")
local monster = {}

monster.description = "a Mushroom"
monster.experience = 0
monster.outfit = {
	lookTypeEx = 43587,
}

monster.health = 10000
monster.maxHealth = 10000
monster.race = "undead"
monster.corpse = 0
monster.speed = 0
monster.manaCost = 0

monster.changeTarget = {
	interval = 2500,
	chance = 40,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 10,
	damage = 10,
	random = 10,
}

monster.flags = {
	summonable = false,
	attackable = false,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 98,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = true,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {}

monster.loot = {}

monster.attacks = {
	{ name = "combat", interval = 5000, chance = 100, type = COMBAT_LIFEDRAIN, minDamage = -1500, maxDamage = -2000, radius = 5, effect = CONST_ME_POISONAREA, target = false }, -- life drain bomb
}

monster.defenses = {
	defense = 100,
	armor = 0,
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
	{ type = "outfit", condition = true },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = true },
}

mType.onThink = function(monster, interval)
	local monsterId = monster:getId()
	local accumulatedTime = monster:getStorageValue(RottenBlood.mushroomConfiguration.storageKey)

	if accumulatedTime == -1 then
		accumulatedTime = 0
	end

	accumulatedTime = accumulatedTime + interval
	monster:setStorageValue(RottenBlood.mushroomConfiguration.storageKey, accumulatedTime)

	if accumulatedTime >= 5000 then
		monster:setStorageValue(RottenBlood.mushroomConfiguration.storageKey, -1)
		monster:getPosition():sendMagicEffect(CONST_ME_POFF)
		monster:remove()
	end
end

mType.onAppear = function(monster, creature)
	local monsterId = monster:getId()
	monster:setStorageValue(RottenBlood.mushroomConfiguration.storageKey, 0)
end

mType:register(monster)
