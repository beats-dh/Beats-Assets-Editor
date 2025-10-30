local mType = Game.createMonsterType("Pillar of Dark Energy")
local monster = {}
monster.description = "a pillar of dark energy"
monster.experience = 0
monster.outfit = {
	lookTypeEx = 43588,
}
monster.health = 37500
monster.maxHealth = 37500
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
monster.voices = {}
monster.loot = {}
monster.attacks = {}
monster.defenses = {
	defense = 100,
	armor = 0,
}
monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_LIFEDRAIN,
		percent = 0,
	},
	{
		type = COMBAT_MANADRAIN,
		percent = 0,
	},
	{
		type = COMBAT_DROWNDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ICEDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_HOLYDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_DEATHDAMAGE,
		percent = 0,
	},
}
monster.immunities = {
	{
		type = "paralyze",
		condition = true,
	},
	{
		type = "outfit",
		condition = true,
	},
	{
		type = "invisible",
		condition = true,
	},
	{
		type = "bleed",
		condition = true,
	},
}
mType.onThink = function(monster, interval)
	local monsterId = monster:getId()
	local accumulatedTime = monster:getStorageValue(RottenBlood.pillarsConfiguration.storageKey)
	if accumulatedTime == -1 then
		accumulatedTime = 0
	end
	accumulatedTime = accumulatedTime + interval
	monster:setStorageValue(RottenBlood.pillarsConfiguration.storageKey, accumulatedTime)
	if accumulatedTime >= 5000 then
		monster:setStorageValue(RottenBlood.pillarsConfiguration.storageKey, -1);
		(monster:getPosition()):sendMagicEffect(249)
		monster:remove()
	end
end
mType.onAppear = function(monster, creature) end
mType:register(monster)
