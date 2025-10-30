local mType = Game.createMonsterType("The Old Whopper")
local monster = {}

monster.description = "The Old Whopper"
monster.experience = 750
monster.outfit = {
    lookType = 277,
    lookHead = 0,
    lookBody = 0,
    lookLegs = 0,
    lookFeet = 0,
    lookAddons = 0,
    lookMount = 0,
}

monster.bosstiary = {
    bossRaceId = 422,
    bossRace = RARITY_NEMESIS,
}

monster.health = 785
monster.maxHealth = 785
monster.race = "blood"
monster.corpse = 5962
monster.speed = 95
monster.manaCost = 0

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
    illusionable = false,
    canPushItems = true,
    canPushCreatures = true,
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
    { text = "Han oydar hot auden oydar", yell = false },
    { text = "Gnothi se authon!", yell = false },
    { text = "Cyclops methron!", yell = false },
    { text = "Other humy, other taste!", yell = false },
}

monster.loot = {
    { name = "gold coin", chance = 80000, maxCount = 84 },
    { name = "meat", chance = 20000 },
    { name = "cyclops toe", chance = 5000 },
	{ id = 7398, chance = 10000 }, -- cyclops trophy
    { id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
    { name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -175 },
}

monster.defenses = {
    defense = 20,
    armor = 25,
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
    { type = "paralyze", condition = false },
    { type = "outfit", condition = false },
    { type = "invisible", condition = true },
    { type = "bleed", condition = false },
}

mType:register(monster)

