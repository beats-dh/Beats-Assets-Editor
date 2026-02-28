const fs = require('fs');
const filepath = 'c:/Users/danie/Documentos/Beats-Assets-Editor/src/lib/components/asset-details/AssetEditForm.svelte';
let code = fs.readFileSync(filepath, 'utf-8');

const replacements = [
    ['<h4>Hook</h4>', '<h4>{translate("asset.edit.attr.hook")}</h4>'],
    ['<span class="detail-label">Direction:</span>', '<span class="detail-label">{translate("asset.edit.field.direction")}</span>'],
    ['<option value={1}>Sul (1)</option>', '<option value={1}>{translate("asset.edit.south")}</option>'],
    ['<option value={2}>Leste (2)</option>', '<option value={2}>{translate("asset.edit.east")}</option>'],
    ['<h4>Lens Help</h4>', '<h4>{translate("asset.edit.attr.lensHelp")}</h4>'],
    ['<span class="detail-label">ID:</span>', '<span class="detail-label">{translate("asset.edit.field.id")}</span>'],
    ['<h4>Clothes</h4>', '<h4>{translate("asset.edit.attr.clothes")}</h4>'],
    ['<span class="detail-label">Slot:</span>', '<span class="detail-label">{translate("asset.edit.field.slot")}</span>'],
    ['<option value={0}>None</option>', '<option value={0}>{translate("asset.edit.opt.none")}</option>'],
    ['<option value={1}>Helmet</option>', '<option value={1}>{translate("asset.edit.opt.helmet")}</option>'],
    ['<option value={2}>Amulet</option>', '<option value={2}>{translate("asset.edit.opt.amulet")}</option>'],
    ['<option value={3}>Backpack</option>', '<option value={3}>{translate("asset.edit.opt.backpack")}</option>'],
    ['<option value={4}>Armor</option>', '<option value={4}>{translate("asset.edit.opt.armor")}</option>'],
    ['<option value={5}>Shield</option>', '<option value={5}>{translate("asset.edit.opt.shield")}</option>'],
    ['<option value={6}>Weapon</option>', '<option value={6}>{translate("asset.edit.opt.weapon")}</option>'],
    ['<option value={7}>Legs</option>', '<option value={7}>{translate("asset.edit.opt.legs")}</option>'],
    ['<option value={8}>Boots</option>', '<option value={8}>{translate("asset.edit.opt.boots")}</option>'],
    ['<option value={9}>Ring</option>', '<option value={9}>{translate("asset.edit.opt.ring")}</option>'],
    ['<option value={10}>Arrow / Quiver</option>', '<option value={10}>{translate("asset.edit.opt.arrowQuiver")}</option>'],

    ['<h4>Default Action</h4>', '<h4>{translate("asset.edit.attr.defaultAction")}</h4>'],
    ['<span class="detail-label">Action:</span>', '<span class="detail-label">{translate("asset.edit.field.action")}</span>'],
    ['<option value={1}>Look</option>', '<option value={1}>{translate("asset.edit.opt.look")}</option>'],
    ['<option value={2}>Use</option>', '<option value={2}>{translate("asset.edit.opt.use")}</option>'],
    ['<option value={3}>Open</option>', '<option value={3}>{translate("asset.edit.opt.open")}</option>'],
    ['>Autowalk Highlight</option', '>{translate("asset.edit.opt.autowalkHi")}</option'],

    ['<h4>Weapon Type</h4>', '<h4>{translate("asset.edit.attr.weaponType")}</h4>'],
    ['<span class="detail-label">Type:</span>', '<span class="detail-label">{translate("asset.edit.field.type")}</span>'],
    ['<option value={0}>No Weapon</option', '<option value={0}>{translate("asset.edit.opt.noWeapon")}</option'],
    ['<option value={1}>Sword</option>', '<option value={1}>{translate("asset.edit.opt.sword")}</option>'],
    ['<option value={2}>Axe</option>', '<option value={2}>{translate("asset.edit.opt.axe")}</option>'],
    ['<option value={3}>Club</option>', '<option value={3}>{translate("asset.edit.opt.club")}</option>'],
    ['<option value={4}>Fist</option>', '<option value={4}>{translate("asset.edit.opt.fist")}</option>'],
    ['<option value={5}>Bow</option>', '<option value={5}>{translate("asset.edit.opt.bow")}</option>'],
    ['<option value={6}>Crossbow</option', '<option value={6}>{translate("asset.edit.opt.crossbow")}</option'],
    ['<option value={7}>Wand Rod</option>', '<option value={7}>{translate("asset.edit.opt.wandRod")}</option>'],
    ['<option value={8}>Throw</option', '<option value={8}>{translate("asset.edit.opt.throw")}</option'],

    ['<h4>Market</h4>', '<h4>{translate("asset.edit.attr.market")}</h4>'],
    ['<span class="detail-label">Category:</span>', '<span class="detail-label">{translate("asset.edit.field.category")}</span>'],
    ['<span class="detail-label">Trade As Object ID:</span>', '<span class="detail-label">{translate("asset.edit.field.tradeAsObjId")}</span>'],
    ['<span class="detail-label">Show As Object ID:</span>', '<span class="detail-label">{translate("asset.edit.field.showAsObjId")}</span>'],

    ['<h4>Changed To Expire</h4>', '<h4>{translate("asset.edit.attr.changedToExpire")}</h4>'],
    ['<span class="detail-label">Former Object Type ID:</span>', '<span class="detail-label">{translate("asset.edit.field.formerObjId")}</span>'],

    ['<h4>Cyclopedia</h4>', '<h4>{translate("asset.edit.attr.cyclopedia")}</h4>'],
    ['<span class="detail-label">Cyclopedia Type:</span>', '<span class="detail-label">{translate("asset.edit.field.cyclopediaType")}</span>'],

    ['<h4>Upgrade Classification</h4>', '<h4>{translate("asset.edit.attr.upgradeClass")}</h4>'],
    ['<span class="detail-label">Classification:</span>', '<span class="detail-label">{translate("asset.edit.field.classification")}</span>'],

    ['<h4>Skillwheel Gem</h4>', '<h4>{translate("asset.edit.attr.skillwheelGem")}</h4>'],
    ['<span class="detail-label">Gem Quality ID:</span>', '<span class="detail-label">{translate("asset.edit.field.gemQualId")}</span>'],
    ['<span class="detail-label">Vocation ID:</span>', '<span class="detail-label">{translate("asset.edit.field.vocId")}</span>'],

    ['<h4>Imbueable</h4>', '<h4>{translate("asset.edit.attr.imbueable")}</h4>'],
    ['<span class="detail-label">Slot Count:</span>', '<span class="detail-label">{translate("asset.edit.field.slotCount")}</span>'],

    ['<h4>Proficiency</h4>', '<h4>{translate("asset.edit.attr.proficiency")}</h4>'],
    ['<span class="detail-label">Proficiency ID:</span>', '<span class="detail-label">{translate("asset.edit.field.profId")}</span>'],

    ['<h4>Requirements</h4>', '<h4>{translate("asset.edit.attr.requirements")}</h4>'],
    ['<span class="detail-label">Minimum Level:</span>', '<span class="detail-label">{translate("asset.edit.field.minLevel")}</span>'],
    ['<span class="detail-label">Vocations:</span>', '<span class="detail-label">{translate("asset.edit.field.vocations")}</span>'],
    ['Vocação ID {i + 1}', '{translate("asset.edit.lbl.vocId", { id: String(i + 1) })}'],
    ['"Digite o ID da vocacao:"', 'translate("asset.edit.prompt.vocId")'],
    ['>+ Add Vocation ID</button', '>{translate("asset.edit.btn.addVoc")}</button'],
    ['<span>Vocação ID {extraVoc}</span>', '<span>{translate("asset.edit.lbl.vocId", { id: String(extraVoc) })}</span>'],
    ['>Remover</button', '>{translate("asset.edit.btn.remove")}</button'],

    ['<h4>NPC Sale Data</h4>', '<h4>{translate("asset.edit.attr.npcSaleData")}</h4>'],
    ['<strong>NPC #{index + 1}</strong>', '<strong>{translate("asset.edit.lbl.npcNum", { num: String(index + 1) })}</strong>'],
    ['<span class="detail-label">Name:</span>', '<span class="detail-label">{translate("asset.edit.name")}</span>'],
    ['<span class="detail-label">Location:</span>', '<span class="detail-label">{translate("asset.edit.field.location")}</span>'],
    ['<span class="detail-label">Sale Price:</span>', '<span class="detail-label">{translate("asset.edit.field.salePrice")}</span>'],
    ['<span class="detail-label">Buy Price:</span>', '<span class="detail-label">{translate("asset.edit.field.buyPrice")}</span>'],
    ['<span class="detail-label">Currency Object ID:</span>', '<span class="detail-label">{translate("asset.edit.field.currencyObjId")}</span>'],
    ['>+ Adicionar NPC Sale Data</button', '>{translate("asset.edit.btn.addNpc")}</button']
];

for (const [from, to] of replacements) {
    // Use replaceAll to ensure all occurrences (like '>Remover</button') are replaced
    code = code.split(from).join(to);
}

fs.writeFileSync(filepath, code);
console.log('done');
