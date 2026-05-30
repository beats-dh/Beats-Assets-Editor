// Helpers for emitting valid Lua source from arbitrary data.

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

#[cfg(test)]
mod tests {
    use super::*;

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
