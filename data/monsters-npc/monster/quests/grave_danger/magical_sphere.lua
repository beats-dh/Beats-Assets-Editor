local mType = Game.createMonsterType("Magical Sphere")
local monster = {}

-- Center position where Earl Osam is channeling
local EarlOsamCenterPosition = { x = 33488, y = 31438, z = 13 }

monster.description = "Magical Sphere"
monster.experience = 0
monster.outfit = {
	lookType = 979,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 20000
monster.maxHealth = 20000
monster.race = "energy"
monster.corpse = 0
monster.speed = 80
monster.manaCost = 0
monster.maxSummons = 0

monster.events = {
	"MagicalSphereDeath",
}

monster.changeTarget = {
	interval = 5000,
	chance = 20,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = false,
	convinceable = false,
	pushable = false,
	ignorePlayer = true,
	rewardBoss = false,
	illusionable = false,
	canPushItems = false,
	canPushCreatures = false,
	staticAttackChance = 0,
	targetDistance = 0,
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

monster.defenses = {
	defense = 40,
	armor = 40,
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
	{ type = COMBAT_DEATHDAMAGE, percent = -20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType.onMove = function(monster, creature, fromPosition, toPosition)
	if toPosition.x == EarlOsamCenterPosition.x 
		and toPosition.y == EarlOsamCenterPosition.y 
		and toPosition.z == EarlOsamCenterPosition.z then
		
		monster:getPosition():sendMagicEffect(CONST_ME_PURPLEENERGY)
		
		local tile = Tile(Position(EarlOsamCenterPosition.x, EarlOsamCenterPosition.y, EarlOsamCenterPosition.z))
		if tile then
			for _, creatureOnTile in ipairs(tile:getCreatures()) do
				if creatureOnTile:isMonster() and creatureOnTile:getName():lower() == "channeling earl osam" then
					creatureOnTile:addHealth(80000)
				end
			end
		end
		
		monster:remove()
	end
end

mType:register(monster)
