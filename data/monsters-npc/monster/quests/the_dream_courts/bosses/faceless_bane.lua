local mType = Game.createMonsterType("Faceless Bane")
local monster = {}

monster.description = "Faceless Bane"
monster.experience = 20000
monster.outfit = {
	lookType = 1119,
	lookHead = 0,
	lookBody = 2,
	lookLegs = 95,
	lookFeet = 97,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 35000
monster.maxHealth = 35000
monster.race = "blood"
monster.corpse = 30013
monster.speed = 125
monster.manaCost = 0

monster.events = {
	"dreamCourtsDeath",
	"facelessThink",
}

monster.changeTarget = {
	interval = 4000,
	chance = 20,
}

monster.reflects = {
	{ type = COMBAT_DEATHDAMAGE, percent = 90 },
}

monster.bosstiary = {
	bossRaceId = 1727,
	bossRace = RARITY_ARCHFOE,
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
}

monster.loot = {
	{ id = 3039, chance = 11669 }, -- red gem
	{ name = "blue gem", chance = 1841 },
	{ name = "book backpack", chance = 616 },
	{ name = "crowbar", chance = 11669 },
	{ name = "cyan crystal fragment", chance = 9212 },
	{ name = "dagger", chance = 33775 },
	{ name = "dream blossom staff", chance = 1225 },
	{ name = "ectoplasmic shield", chance = 1225 },
	{ id = 30344, chance = 1225 }, -- enchanted pendulet
	{ id = 282, chance = 616 }, -- giant shimmering pearl
	{ name = "gold ingot", chance = 5831 },
	{ name = "green crystal shard", chance = 3073 },
	{ name = "green gem", chance = 5831 },
	{ name = "hailstorm rod", chance = 6755 },
	{ name = "hexagonal ruby", chance = 616 },
	{ name = "ice rapier", chance = 12894 },
	{ name = "knife", chance = 8596 },
	{ name = "life crystal", chance = 7371 },
	{ name = "lightning pendant", chance = 1841 },
	{ name = "moonlight rod", chance = 3682 },
	{ name = "necrotic rod", chance = 1841 },
	{ name = "orb", chance = 1841 },
	{ name = "platinum coin", chance = 58331, maxCount = 19 },
	{ name = "red crystal fragment", chance = 11669 },
	{ name = "small sapphire", chance = 23331, maxCount = 4 },
	{ name = "snakebite rod", chance = 4914 },
	{ name = "spear", chance = 11669, maxCount = 3 },
	{ name = "spirit guide", chance = 1225 },
	{ name = "springsprout rod", chance = 616 },
	{ name = "strange talisman", chance = 1841 },
	{ name = "terra rod", chance = 15967 },
	{ name = "twin hooks", chance = 9212 },
	{ name = "underworld rod", chance = 2457 },
	{ name = "violet crystal shard", chance = 1841 },
	{ name = "violet gem", chance = 1225 },
	{ name = "wand of everblazing", chance = 616 },
	{ name = "yellow gem", chance = 11669 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", type = COMBAT_PHYSICALDAMAGE, interval = 2000, minDamage = 0, maxDamage = -575 },
	{ name = "combat", interval = 2000, chance = 65, type = COMBAT_FIREDAMAGE, minDamage = -350, maxDamage = -500, radius = 3, Effect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = false },
	{ name = "combat", interval = 2000, chance = 45, type = COMBAT_DEATHDAMAGE, minDamage = -335, maxDamage = -450, radius = 4, Effect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_PHYSICALDAMAGE, minDamage = -330, maxDamage = -380, length = 7, effect = CONST_ME_EXPLOSIONAREA, target = false },
	{ name = "combat", interval = 2000, chance = 35, type = COMBAT_FIREDAMAGE, minDamage = -300, maxDamage = -410, range = 4, radius = 4, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_ENERGYDAMAGE, minDamage = -385, maxDamage = -535, range = 4, radius = 1, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYAREA, target = true },
}

monster.defenses = {
	defense = 5,
	armor = 10,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 50 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = -20 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 50 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType.onSpawn = function(monster, spawnPosition)
	if monster:getType():isRewardBoss() then
		-- reset global storage state to default / ensure sqm's reset for the next team
		Game.setStorageValue(GlobalStorage.TheDreamCourts.FacelessBane.Deaths, -1)
		Game.setStorageValue(GlobalStorage.TheDreamCourts.FacelessBane.StepsOn, -1)
		Game.setStorageValue(GlobalStorage.TheDreamCourts.FacelessBane.ResetSteps, 1)
		monster:registerEvent("facelessBaneImmunity")
		monster:setReward(true)
	end
end

mType:register(monster)
