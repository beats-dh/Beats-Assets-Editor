local mType = Game.createMonsterType("Hatebreeder")
local monster = {}

monster.description = "Hatebreeder"
monster.experience = 11000
monster.outfit = {
    lookType = 351,
    lookHead = 0,
    lookBody = 0,
    lookLegs = 0,
    lookFeet = 0,
    lookAddons = 0,
    lookMount = 0,
}

monster.bosstiary = {
    bossRaceId = 678,
    bossRace = RARITY_NEMESIS,
}

monster.health = 18000
monster.maxHealth = 18000
monster.race = "undead"
monster.corpse = 0
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
    { text = "YOU'RE DESECRATING OUR PALACE!", yell = true },
    { text = "SCRAM, YOU FOOLS!", yell = true },
    { text = "YOU ARE NOT WELCOME HERE!", yell = true },
}

monster.loot = {
    { name = "gold coin", chance = 50000, maxCount = 186 },
    { name = "platinum coin", chance = 30000, maxCount = 2 },
    { name = "great spirit potion", chance = 20000, maxCount = 5 },
    { name = "ultimate health potion", chance = 20000, maxCount = 5 },
    { name = "cobra crown", chance = 200 },
    { name = "demonic essence", chance = 5000 },
    { name = "draken boots", chance = 200 },
    { name = "drakinata", chance = 500 },
    { name = "ghastly dragon head", chance = 100 },
    { name = "guardian boots", chance = 200 },
    { name = "jade hat", chance = 100 },
    { name = "spellweaver's robe", chance = 100 },
    { name = "twin hooks", chance = 200 },
    { name = "undead heart", chance = 2000 },
    { name = "zaoan halberd", chance = 500 },
    { name = "zaoan helmet", chance = 500 },
    { name = "zaoan legs", chance = 500 },
    { name = "zaoan shoes", chance = 500 },
    { name = "zaoan sword", chance = 500 },
    { name = "zaoan monk robe", chance = 500 },
    { name = "snake god's wristguard", chance = 100 },
    { name = "snake god's sceptre", chance = 50 },
    { id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
    { name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -850 },
    { name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -300, maxDamage = -450, length = 8, spread = 3, effect = CONST_ME_MORTAREA, target = false },
    { name = "combat", interval = 2000, chance = 15, type = COMBAT_LIFEDRAIN, minDamage = -200, maxDamage = -300, range = 7, radius = 3, effect = CONST_ME_MAGIC_RED, target = true },
    { name = "speed", interval = 4000, chance = 15, speedChange = -600, effect = CONST_ME_MAGIC_RED, target = true, duration = 5000 },
}

monster.defenses = {
    defense = 55,
    armor = 60,
    { name = "combat", interval = 2000, chance = 20, type = COMBAT_HEALING, minDamage = 0, maxDamage = 2500, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
    { type = COMBAT_PHYSICALDAMAGE, percent = -10 },
    { type = COMBAT_ENERGYDAMAGE, percent = -10 },
    { type = COMBAT_EARTHDAMAGE, percent = 100 },
    { type = COMBAT_FIREDAMAGE, percent = 10 },
    { type = COMBAT_LIFEDRAIN, percent = 0 },
    { type = COMBAT_MANADRAIN, percent = 0 },
    { type = COMBAT_DROWNDAMAGE, percent = 0 },
    { type = COMBAT_ICEDAMAGE, percent = 100 },
    { type = COMBAT_HOLYDAMAGE, percent = -15 },
    { type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
    { type = "paralyze", condition = true },
    { type = "outfit", condition = false },
    { type = "invisible", condition = true },
    { type = "bleed", condition = false },
}

mType:register(monster)

