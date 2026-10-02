use crate::features::npcs::types::*;
use anyhow::{anyhow, Context, Result};
use regex::Regex;
use std::collections::HashSet;

// Checked conversions from the parsed i64 to unsigned widths, so a negative or
// oversized value fails instead of silently wrapping (e.g. -1 -> 4294967295).
fn to_u32(field: &str, v: i64) -> Result<u32> {
    u32::try_from(v).map_err(|_| anyhow!("Field '{}' out of range for u32: {}", field, v))
}
fn to_u8(field: &str, v: i64) -> Result<u8> {
    u8::try_from(v).map_err(|_| anyhow!("Field '{}' out of range for u8: {}", field, v))
}

pub struct LuaNpcParser {
    content: String,
}

impl LuaNpcParser {
    pub fn new(content: String) -> Self {
        Self {
            content,
        }
    }

    pub fn parse(&self) -> Result<Npc> {
        let mut missing_fields: HashSet<String> = HashSet::new();
        let mut npc = Npc::default();

        let internal_name = self.extract_string_field_with_default("name", "", &mut missing_fields)?;
        let internal_desc = self.extract_string_field_with_default("description", "", &mut missing_fields)?;

        npc.name = internal_name;
        npc.description = internal_desc;
        npc.health = to_u32("health", self.extract_number_field_with_default("health", 100, &mut missing_fields)?)?;
        npc.max_health = to_u32("maxHealth", self.extract_number_field_with_default("maxHealth", 100, &mut missing_fields)?)?;
        npc.walk_interval = to_u32("walkInterval", self.extract_number_field_with_default("walkInterval", 2000, &mut missing_fields)?)?;
        npc.walk_radius = to_u8("walkRadius", self.extract_number_field_with_default("walkRadius", 2, &mut missing_fields)?)?;
        npc.outfit = self.parse_outfit()?.unwrap_or_default();
        npc.flags = self.parse_flags()?.unwrap_or_default();

        npc.amount_level = self.extract_number_field_optional("amountLevel")?.map(|v| to_u32("amountLevel", v)).transpose()?;
        npc.amount_money = self.extract_number_field_optional("amountMoney")?.map(|v| to_u32("amountMoney", v)).transpose()?;
        npc.currency = self.extract_number_field_optional("currency")?.map(|v| to_u32("currency", v)).transpose()?;
        npc.max_level = self.extract_number_field_optional("maxLevel")?.map(|v| to_u32("maxLevel", v)).transpose()?;
        npc.money_to_need_donation = self.extract_number_field_optional("moneyToNeedDonation")?.map(|v| to_u32("moneyToNeedDonation", v)).transpose()?;
        npc.respawn_type = self.extract_string_field_optional("respawnType")?;

        npc.shop = self.parse_shop(&mut missing_fields)?;
        npc.voices = self.parse_voices(&mut missing_fields)?;

        npc.interactions = self.parse_interactions()?;

        let mut meta = NpcMeta::default();
        if !missing_fields.is_empty() {
            let mut missing: Vec<String> = missing_fields.into_iter().collect();
            missing.sort();
            meta.missing_fields = missing;
        }

        npc.meta = meta;

        Ok(npc)
    }

    fn extract_string_field_optional(&self, field: &str) -> Result<Option<String>> {
        let pattern = format!(r#"npcConfig\.{}\s*=\s*(?:internalNpcName|"(.*?)")"#, field);
        let re = Regex::new(&pattern)?;
        if let Some(caps) = re.captures(&self.content) {
            if let Some(m) = caps.get(1) {
                return Ok(Some(m.as_str().to_string()));
            } else {
                // matched internalNpcName
                let internal_re = Regex::new(r#"local\s+internalNpcName\s*=\s*"([^"]+)""#)?;
                if let Some(internal_caps) = internal_re.captures(&self.content) {
                    return Ok(Some(internal_caps[1].to_string()));
                }
            }
        }
        Ok(None)
    }

    fn extract_string_field_with_default(&self, field: &str, default: &str, missing_fields: &mut HashSet<String>) -> Result<String> {
        match self.extract_string_field_optional(field)? {
            Some(value) => Ok(value),
            None => {
                missing_fields.insert(field.to_string());
                Ok(default.to_string())
            }
        }
    }

    fn extract_number_field_optional(&self, field: &str) -> Result<Option<i64>> {
        let pattern = format!(r"npcConfig\.{}\s*=\s*(npcConfig\.health|-?\d+)", field);
        let re = Regex::new(&pattern)?;
        if let Some(caps) = re.captures(&self.content) {
            if &caps[1] == "npcConfig.health" {
                // Return extracting health
                let health_pattern = r"npcConfig\.health\s*=\s*(-?\d+)";
                let health_re = Regex::new(health_pattern)?;
                return Ok(health_re.captures(&self.content).and_then(|caps| caps.get(1).and_then(|m| m.as_str().parse().ok())));
            }
            return Ok(Some(caps[1].parse()?));
        }
        Ok(None)
    }

    fn extract_number_field_with_default(&self, field: &str, default: i64, missing_fields: &mut HashSet<String>) -> Result<i64> {
        match self.extract_number_field_optional(field)? {
            Some(value) => Ok(value),
            None => {
                missing_fields.insert(field.to_string());
                Ok(default)
            }
        }
    }

    fn parse_outfit(&self) -> Result<Option<NpcOutfit>> {
        let Some(section) = self.extract_table_optional("outfit")? else {
            return Ok(None);
        };
        Ok(Some(NpcOutfit {
            look_type: self.extract_from_section(&section, "lookType")? as u32,
            look_head: self.extract_from_section(&section, "lookHead")? as u8,
            look_body: self.extract_from_section(&section, "lookBody")? as u8,
            look_legs: self.extract_from_section(&section, "lookLegs")? as u8,
            look_feet: self.extract_from_section(&section, "lookFeet")? as u8,
            look_addons: self.extract_from_section(&section, "lookAddons")? as u8,
            look_mount: self.extract_from_section(&section, "lookMount")? as u16,
        }))
    }

    fn parse_flags(&self) -> Result<Option<NpcFlags>> {
        let Some(section) = self.extract_table_optional("flags")? else {
            return Ok(None);
        };
        Ok(Some(NpcFlags {
            floorchange: self.extract_bool_from_section(&section, "floorchange")?,
        }))
    }

    fn extract_table(&self, table_name: &str) -> Result<String> {
        let search = format!("npcConfig.{}", table_name);
        let content = &self.content;
        let start_pos = content.find(&search).context(format!("Failed to find table: {}", table_name))?;

        let bytes = content.as_bytes();
        let len = bytes.len();
        let mut idx = start_pos + search.len();

        while idx < len && bytes[idx].is_ascii_whitespace() {
            idx += 1;
        }
        if idx >= len || bytes[idx] != b'=' {
            return Err(anyhow!("Failed to find '='"));
        }
        idx += 1;

        while idx < len && bytes[idx].is_ascii_whitespace() {
            idx += 1;
        }
        if idx >= len || bytes[idx] != b'{' {
            return Err(anyhow!("Failed to locate opening brace"));
        }

        let start = idx + 1;
        let mut depth = 1;
        let mut cursor = start;

        while cursor < len {
            match bytes[cursor] {
                b'{' => {
                    depth += 1;
                    cursor += 1;
                }
                b'}' => {
                    depth -= 1;
                    if depth == 0 {
                        return Ok(content[start..cursor].to_string());
                    }
                    cursor += 1;
                }
                b'"' => {
                    cursor += 1;
                    while cursor < len {
                        if bytes[cursor] == b'\\' {
                            cursor += 2;
                        } else if bytes[cursor] == b'"' {
                            cursor += 1;
                            break;
                        } else {
                            cursor += 1;
                        }
                    }
                }
                _ => cursor += 1,
            }
        }
        Err(anyhow!("Failed to find closing brace for table"))
    }

    /// Absent section -> `Ok(None)`; present-but-structurally-broken -> `Err`.
    /// Lets callers default a missing section without masking real corruption.
    fn extract_table_optional(&self, table_name: &str) -> Result<Option<String>> {
        if !self.content.contains(&format!("npcConfig.{}", table_name)) {
            return Ok(None);
        }
        self.extract_table(table_name).map(Some)
    }

    fn extract_from_section(&self, section: &str, key: &str) -> Result<i64> {
        let pattern = format!(r"{}\s*=\s*(-?\d+)", key);
        let re = Regex::new(&pattern)?;
        if let Some(caps) = re.captures(section) {
            Ok(caps[1].parse()?)
        } else {
            Ok(0)
        }
    }

    fn extract_bool_from_section(&self, section: &str, key: &str) -> Result<bool> {
        let pattern = format!(r"{}\s*=\s*(true|false)", key);
        let re = Regex::new(&pattern)?;
        if let Some(caps) = re.captures(section) {
            Ok(&caps[1] == "true")
        } else {
            Ok(false)
        }
    }

    fn parse_shop(&self, _missing_fields: &mut HashSet<String>) -> Result<Option<Vec<NpcShopItem>>> {
        if !self.content.contains("npcConfig.shop") {
            return Ok(None);
        }

        let re_direct = Regex::new(r"npcConfig\.shop\s*=\s*\{")?;
        if !re_direct.is_match(&self.content) {
            return Ok(None);
        }

        // Present (marker matched above) but unparseable -> surface the error
        // instead of silently dropping the shop.
        let section = self.extract_table("shop")?;

        let mut items = Vec::new();
        let item_re = Regex::new(r#"(?s)\{\s*(.*?)\s*\}"#)?;

        for cap in item_re.captures_iter(&section) {
            let inner = &cap[1];
            let mut item = NpcShopItem::default();

            if let Some(c) = Regex::new(r#"itemName\s*=\s*"([^"]+)""#)?.captures(inner) {
                item.item_name = Some(c[1].to_string());
            } else if let Some(c) = Regex::new(r#"name\s*=\s*"([^"]+)""#)?.captures(inner) {
                item.item_name = Some(c[1].to_string());
            }
            if let Some(c) = Regex::new(r"clientId\s*=\s*(\d+)")?.captures(inner) {
                item.client_id = Some(c[1].parse().unwrap_or(0));
            }
            if let Some(c) = Regex::new(r"item_?id\s*=\s*(\d+)")?.captures(inner) {
                item.item_id = Some(c[1].parse().unwrap_or(0));
            }
            if let Some(c) = Regex::new(r"buy\s*=\s*(\d+)")?.captures(inner) {
                item.buy = Some(c[1].parse().unwrap_or(0));
            }
            if let Some(c) = Regex::new(r"sell\s*=\s*(\d+)")?.captures(inner) {
                item.sell = Some(c[1].parse().unwrap_or(0));
            }
            if let Some(c) = Regex::new(r"count\s*=\s*(\d+)")?.captures(inner) {
                item.count = Some(c[1].parse().unwrap_or(0));
            } else if let Some(c) = Regex::new(r"sub[Tt]ype\s*=\s*(\d+)")?.captures(inner) {
                // `subType`/`subtype` is equivalent to `count` for NPC shop subtype in Canary.
                item.count = Some(c[1].parse().unwrap_or(0));
            }

            if item.item_name.is_some() || item.client_id.is_some() || item.item_id.is_some() {
                items.push(item);
            }
        }

        if items.is_empty() {
            return Ok(None);
        }
        Ok(Some(items))
    }

    fn parse_voices(&self, _missing_fields: &mut HashSet<String>) -> Result<Option<NpcVoices>> {
        if !self.content.contains("npcConfig.voices") {
            return Ok(None);
        }

        // Present (marker matched above) but unparseable -> surface the error.
        let section = self.extract_table("voices")?;

        let mut voices = NpcVoices::default();
        if let Some(c) = Regex::new(r"interval\s*=\s*(\d+)")?.captures(&section) {
            voices.interval = c[1].parse().unwrap_or(0);
        }
        if let Some(c) = Regex::new(r"chance\s*=\s*(\d+)")?.captures(&section) {
            voices.chance = c[1].parse().unwrap_or(0);
        }

        let mut lines = Vec::new();
        let line_re = Regex::new(r#"(?s)\{\s*text\s*=\s*"([^"]+)"(?:,\s*yell\s*=\s*(true|false))?\s*\}"#)?;

        for cap in line_re.captures_iter(&section) {
            let text = cap[1].to_string();
            let yell = cap.get(2).map_or(false, |m| m.as_str() == "true");
            lines.push(NpcVoice {
                text,
                yell,
            });
        }
        voices.lines = lines;

        if voices.lines.is_empty() && voices.interval == 0 {
            return Ok(None);
        }
        Ok(Some(voices))
    }

    fn parse_interactions(&self) -> Result<NpcInteractions> {
        let mut interactions = NpcInteractions::default();
        let content = &self.content;

        // 1. Parse Messages: npcHandler:setMessage(MESSAGE_GREET, "Hello!")
        let msg_re = Regex::new(r#"npcHandler:setMessage\(\s*(MESSAGE_[A-Z_]+)\s*,\s*"([^"]+)"\s*\)"#)?;
        for cap in msg_re.captures_iter(content) {
            interactions.messages.insert(cap[1].to_string(), cap[2].to_string());
        }

        // 2. Parse Modules: npcHandler:addModule(FocusModule:new(), ... )
        let mod_re = Regex::new(r#"npcHandler:addModule\(\s*([A-Za-z0-9_]+):new\(\)\s*,"#)?;
        for cap in mod_re.captures_iter(content) {
            let mod_name = cap[1].to_string();
            if !interactions.modules.contains(&mod_name) {
                interactions.modules.push(mod_name);
            }
        }

        // 3. Parse Keywords: keywordHandler:addKeyword({ "hi", "hello" }, StdModule.say, { ... text = "..." })
        let kw_re = Regex::new(r#"keywordHandler:add(Greet)?Keyword\(\s*\{\s*([^}]+)\s*\}\s*,\s*[^,]+,\s*\{[^}]*text\s*=\s*"([^"]+)"[^}]*\}"#)?;
        for cap in kw_re.captures_iter(content) {
            let is_greet = cap.get(1).is_some();
            let words_str = cap[2].to_string();
            let response = cap[3].to_string();

            let mut words = Vec::new();
            let word_re = Regex::new(r#""([^"]+)""#)?;
            for w_cap in word_re.captures_iter(&words_str) {
                words.push(w_cap[1].to_string());
            }

            // We differentiate simple keywords from greets natively later in IO writer or via custom flag,
            // for now grouping them to display on the UI cleanly:
            if is_greet && !words.is_empty() {
                words[0] = format!("__greet:{}", words[0]);
            }

            interactions.keywords.push(NpcKeyword {
                words,
                response,
            });
        }

        // 4. Raw Code Extraction
        let kw_handler_marker = "local keywordHandler = KeywordHandler:new()";
        if let Some(pos) = content.find(kw_handler_marker) {
            let raw_bottom = content[pos..].to_string();

            let safe_marker = "npcType.onCloseChannel";
            if let Some(safe_pos) = raw_bottom.find(safe_marker) {
                let mut after_events = raw_bottom[safe_pos..].to_string();

                // Jump past the onCloseChannel block
                if let Some(end_idx) = after_events.find("end") {
                    after_events = after_events[end_idx + 3..].to_string();
                }

                // Cleanup common footers so we only capture pure Custom Lua
                let re_cleanup = Regex::new(r#"(?s)(npcHandler:addModule\([^)]+\)|npcType:register\([^)]+\)\s*|--\s*[^\n]+)"#)?;
                let raw_code = re_cleanup.replace_all(&after_events, "").to_string();

                // Filter the already parsed keywords/messages to avoid duplicating them on IO rewrite
                let re_kw_cleanup = Regex::new(r#"(?m)^.*keywordHandler:add.*Keyword.*\n?"#)?;
                let raw_code = re_kw_cleanup.replace_all(&raw_code, "").to_string();

                let re_msg_cleanup = Regex::new(r#"(?m)^.*npcHandler:setMessage.*\n?"#)?;
                let raw_code = re_msg_cleanup.replace_all(&raw_code, "").to_string();

                let re_cb_cleanup = Regex::new(r#"(?m)^.*npcHandler:setCallback.*\n?"#)?;
                let raw_code = re_cb_cleanup.replace_all(&raw_code, "").to_string();

                interactions.raw_code = raw_code.trim().to_string();
            }
        }

        Ok(interactions)
    }
}
