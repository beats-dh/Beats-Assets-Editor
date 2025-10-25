# Protobuf Files - Tibia 15.x

Este diretório contém os arquivos Protocol Buffer (.proto) usados pelo cliente Tibia 15.x.

## 📁 Arquivos

### Arquivos Ativos (Em uso)

- **`appearances.proto`** - Arquivo oficial extraído do `client.exe` do Tibia 15
  - Define estruturas para Objects, Outfits, Effects e Missiles
  - Tamanho: ~6KB (215 linhas)
  - Package: `tibia.protobuf.appearances`
  - Importa: `shared.proto`

- **`shared.proto`** - Arquivo oficial extraído do `client.exe` do Tibia 15
  - Define enums compartilhados (PLAYER_ACTION, ITEM_CATEGORY, VOCATION, etc.)
  - Tamanho: ~1.6KB (68 linhas)
  - Package: `tibia.protobuf.shared`

### Arquivos de Backup

- **`appearances_canary_backup.proto`** - Versão do OpenTibiaBR Canary
  - Funciona, mas não é 100% idêntico ao cliente oficial
  - Package: `Canary.protobuf.appearances`
  - Usa `bytes` para strings (mais seguro para UTF-8)

- **`appearances_extracted.proto`** - Cópia do arquivo extraído
  - Backup do arquivo original extraído do cliente

- **`appearances_canary.proto`** - Outra cópia do Canary

## 🔍 Diferenças entre Oficial vs Canary

| Característica | Oficial (Extraído) | Canary |
|---------------|-------------------|---------|
| Package | `tibia.protobuf.appearances` | `Canary.protobuf.appearances` |
| Campos name/description | `string` | `bytes` |
| Novos campos | `deco_item_kit`, `AppearanceFlagSkillWheelGem`, `dual_wielding` | Não tem |
| Tamanho | 215 linhas | 273 linhas |
| Fonte | Extraído do client.exe | Repositório Canary |

## 🛠️ Extração dos Arquivos

Os arquivos oficiais foram extraídos usando **Protod3**:
```bash
python Protod3/src/protod3.py "C:\Users\danie\Documentos\Tibia15Igla\bin\client.exe"
```

### Arquivos extraídos do cliente:
- ✅ `appearances.proto` (4.979 bytes no binário)
- ✅ `shared.proto` (1.392 bytes no binário)
- ✅ `map.proto` (1.051 bytes no binário)
- ✅ `sounds.proto` (1.261 bytes no binário)
- ✅ `sounds-common.proto` (15.836 bytes no binário)

## 📊 Estrutura do appearances.proto

### Mensagens Principais

```protobuf
message Appearances {
  repeated Appearance object = 1;
  repeated Appearance outfit = 2;
  repeated Appearance effect = 3;
  repeated Appearance missile = 4;
  optional SpecialMeaningAppearanceIds special_meaning_appearance_ids = 5;
}

message Appearance {
  optional uint32 id = 1;
  repeated FrameGroup frame_group = 2;
  optional AppearanceFlags flags = 3;
  optional string name = 4;
  optional string description = 5;
}
```

### Enums

```protobuf
enum FIXED_FRAME_GROUP {
  FIXED_FRAME_GROUP_OUTFIT_IDLE = 0;
  FIXED_FRAME_GROUP_OUTFIT_MOVING = 1;
  FIXED_FRAME_GROUP_OBJECT_INITIAL = 2;
}
```

### Flags Importantes

- `AppearanceFlagBank` - Waypoints do banco
- `AppearanceFlagLight` - Propriedades de luz
- `AppearanceFlagMarket` - Informações do market
- `AppearanceFlagNPC` - Dados de venda de NPCs
- `AppearanceFlagUpgradeClassification` - Sistema de upgrade
- `AppearanceFlagSkillWheelGem` - **NOVO** no Tibia 15.x
- `deco_item_kit` - **NOVO** no Tibia 15.x
- `dual_wielding` - **NOVO** no Tibia 15.x

## 🔄 Recomendação

**Use sempre o arquivo oficial extraído (`appearances.proto` e `shared.proto`)** para garantir 100% de compatibilidade com seu cliente Tibia.

O arquivo do Canary é uma boa referência, mas pode não ter todos os campos mais recentes do Tibia 15.x.

## 📝 Notas

1. O cliente Tibia usa `string` para `name` e `description`, mas a comunidade recomenda `bytes` para evitar problemas com UTF-8
2. O arquivo oficial tem novos campos relacionados ao sistema de Skill Wheel e decoração que não estão no Canary
3. Todos os arquivos `.proto` foram compilados com sucesso usando `prost-build`

## ✅ Status

- [x] Arquivos extraídos com sucesso
- [x] Compilação funcionando
- [x] Testes passando
- [x] Parser funcionando com dados reais do cliente

---

**Última extração**: 25 de Outubro de 2025
**Cliente**: Tibia 15.x (C:\Users\danie\Documentos\Tibia15Igla\bin\client.exe)
**Ferramenta**: Protod3 (https://github.com/giuinktse7/Protod3)
