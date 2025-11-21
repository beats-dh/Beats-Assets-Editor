# Documentation Rules

## Markdown File Creation

**CRITICAL RULE**: Never create `.md` files without explicit user request.

### Guidelines:
- ❌ Do NOT create summary documents, analysis documents, or any `.md` files automatically
- ❌ Do NOT create documentation files as part of task completion
- ✅ Only create `.md` files when the user explicitly asks for them
- ✅ If you think a document would be helpful, ASK the user first

### Examples:

**WRONG**:
```
User: "Implement the optimization"
Agent: *implements optimization and creates OPTIMIZATION_SUMMARY.md*
```

**CORRECT**:
```
User: "Implement the optimization"
Agent: *implements optimization only*
Agent: "Optimization complete. Would you like me to create a summary document?"
```

### Exceptions:
- Spec files (requirements.md, design.md, tasks.md) when following the spec workflow
- Files explicitly mentioned in user's request
- Updates to existing documentation when requested

---

This rule applies to all interactions and should be followed strictly.
