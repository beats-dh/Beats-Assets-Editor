// Helpers for emitting valid Lua source from arbitrary data.

use regex::Regex;
use std::collections::HashMap;

/// Escape a string so it can be safely embedded inside a double-quoted Lua
/// string literal. Handles backslashes, double quotes and line breaks so that
/// values containing quotes/newlines (descriptions, messages, item names, ...)
/// don't produce broken or syntactically invalid Lua.
pub fn escape_lua_string(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            _ => out.push(ch),
        }
    }
    out
}

/// Surgically rewrite `<field> = <int>` occurrences in Lua source through `map`,
/// leaving every other byte untouched (so custom Lua the parser doesn't model —
/// dynamic shop builders, interactions — is preserved). Returns the new text and
/// how many numbers were replaced. Integers absent from `map` stay as-is.
pub fn remap_lua_int_field(text: &str, field: &str, map: &HashMap<u32, u32>) -> (String, usize) {
    let re = Regex::new(&format!(r"(?m)(\b{}\s*=\s*)(\d+)", regex::escape(field))).expect("valid field regex");
    let mut count = 0usize;
    let out = re
        .replace_all(text, |caps: &regex::Captures| match caps[2].parse::<u32>().ok().and_then(|n| map.get(&n)) {
            Some(new_id) => {
                count += 1;
                format!("{}{}", &caps[1], new_id)
            }
            None => caps[0].to_string(),
        })
        .into_owned();
    (out, count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn remap_lua_int_field_rewrites_only_mapped_ids() {
        let map: HashMap<u32, u32> = [(4000u32, 3001u32)].into_iter().collect();
        let src = "outfit = { lookType = 4000, lookMount = 999 }";
        let (out, n) = remap_lua_int_field(src, "lookType", &map);
        assert_eq!(out, "outfit = { lookType = 3001, lookMount = 999 }");
        assert_eq!(n, 1);
        // lookMount 999 not in map, and lookType regex must not touch lookMount.
        let (out2, n2) = remap_lua_int_field(&out, "lookMount", &map);
        assert_eq!(n2, 0);
        assert_eq!(out2, out);
    }

    #[test]
    fn escapes_quotes_and_backslashes() {
        assert_eq!(escape_lua_string(r#"a"b\c"#), r#"a\"b\\c"#);
    }

    #[test]
    fn escapes_newlines() {
        assert_eq!(escape_lua_string("line1\nline2\r\n"), "line1\\nline2\\r\\n");
    }

    #[test]
    fn leaves_plain_text_untouched() {
        assert_eq!(escape_lua_string("Hello World"), "Hello World");
    }
}
