<script lang="ts">
  import { npcState } from "../../../../stores/npcState.svelte";
  import { translate } from "../../../../i18n";

  function handleInput(field: string, value: string | number) {
    if (npcState.currentNpc) {
      if (!npcState.currentNpc.meta)
        npcState.currentNpc.meta = { missingFields: [], touchedFields: [] };
      if (!npcState.currentNpc.meta.touchedFields.includes(field)) {
        npcState.currentNpc.meta.touchedFields.push(field);
      }

      // Remove from missing if we're adding it
      npcState.currentNpc.meta.missingFields =
        npcState.currentNpc.meta.missingFields.filter((f) => f !== field);

      (npcState.currentNpc as any)[field] = value;
    }
  }

  let name = $derived(npcState.currentNpc?.name ?? "");
  let description = $derived(npcState.currentNpc?.description ?? "");
  let health = $derived(npcState.currentNpc?.health ?? 100);
  let maxHealth = $derived(npcState.currentNpc?.maxHealth ?? 100);
  let walkInterval = $derived(npcState.currentNpc?.walkInterval ?? 2000);
  let walkRadius = $derived(npcState.currentNpc?.walkRadius ?? 2);
</script>

<div class="monster-card">
  <div class="monster-card-header">{translate("npc.card.basic.title")}</div>
  <div class="monster-card-body">
    <div class="card-content">
      <div class="form-group">
        <label for="npc-name">{translate("npc.card.basic.name")}</label>
        <input
          type="text"
          id="npc-name"
          value={name}
          oninput={(e) => handleInput("name", e.currentTarget.value)}
        />
      </div>

      <div class="form-group">
        <label for="npc-desc">{translate("npc.card.basic.description")}</label>
        <input
          type="text"
          id="npc-desc"
          value={description}
          oninput={(e) => handleInput("description", e.currentTarget.value)}
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="npc-health">Vida Atual</label>
          <input
            type="number"
            id="npc-health"
            value={health}
            min="1"
            oninput={(e) =>
              handleInput("health", parseInt(e.currentTarget.value) || 1)}
          />
        </div>

        <div class="form-group">
          <label for="npc-max-health">Vida Máxima</label>
          <input
            type="number"
            id="npc-max-health"
            value={maxHealth}
            min="1"
            oninput={(e) =>
              handleInput("maxHealth", parseInt(e.currentTarget.value) || 1)}
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="npc-walk-interval">Intervalo Caminhada (ms)</label>
          <input
            type="number"
            id="npc-walk-interval"
            value={walkInterval}
            min="0"
            oninput={(e) =>
              handleInput("walkInterval", parseInt(e.currentTarget.value) || 0)}
          />
        </div>

        <div class="form-group">
          <label for="npc-walk-radius">Raio Máx. Caminhada</label>
          <input
            type="number"
            id="npc-walk-radius"
            value={walkRadius}
            min="0"
            oninput={(e) =>
              handleInput("walkRadius", parseInt(e.currentTarget.value) || 0)}
          />
        </div>

        <div class="form-group">
          <label for="npc-respawn-type">Respawn Type</label>
          <input
            type="text"
            id="npc-respawn-type"
            value={npcState.currentNpc?.respawnType ?? ""}
            oninput={(e) => handleInput("respawnType", e.currentTarget.value)}
          />
        </div>
      </div>
    </div>
  </div>
</div>
