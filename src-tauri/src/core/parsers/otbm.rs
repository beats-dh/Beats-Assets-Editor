// OTBM Parser - Based on Remere's Map Editor
// Reference: https://github.com/hampusborgos/rme/blob/master/source/iomap_otbm.cpp

use std::collections::HashMap;
use std::io::{self, Cursor, Read};
use byteorder::{LittleEndian, ReadBytesExt};
use flate2::read::GzDecoder;

// ============================================================================
// CONSTANTS
// ============================================================================

const OTBM_SIGNATURE: &[u8] = b"OTBM";
const NODE_START: u8 = 0xFE;
const NODE_END: u8 = 0xFF;
const ESCAPE_CHAR: u8 = 0xFD;

// ============================================================================
// OTBM NODE TYPES
// Based on RME's OTBM_NodeTypes_t enum
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum NodeType {
    Root = 0,
    MapData = 2,
    ItemDef = 3,
    TileArea = 4,
    Tile = 5,
    Item = 6,
    TileSquare = 7,
    TileRef = 8,
    Spawns = 9,
    SpawnArea = 10,
    Monster = 11,
    Towns = 12,
    Town = 13,
    HouseTile = 14,
    Waypoints = 15,
    Waypoint = 16,
}

impl NodeType {
    fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(NodeType::Root),
            2 => Some(NodeType::MapData),
            3 => Some(NodeType::ItemDef),
            4 => Some(NodeType::TileArea),
            5 => Some(NodeType::Tile),
            6 => Some(NodeType::Item),
            7 => Some(NodeType::TileSquare),
            8 => Some(NodeType::TileRef),
            9 => Some(NodeType::Spawns),
            10 => Some(NodeType::SpawnArea),
            11 => Some(NodeType::Monster),
            12 => Some(NodeType::Towns),
            13 => Some(NodeType::Town),
            14 => Some(NodeType::HouseTile),
            15 => Some(NodeType::Waypoints),
            16 => Some(NodeType::Waypoint),
            _ => None,
        }
    }
}

// ============================================================================
// OTBM ATTRIBUTE TYPES
// Based on RME's OTBM_Attribute enum
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum AttributeType {
    Description = 1,
    ExtFile = 2,
    TileFlags = 3,
    ActionId = 4,
    UniqueId = 5,
    Text = 6,
    Desc = 7,
    TeleDest = 8,
    Item = 9,
    DepotId = 10,
    ExtSpawnFile = 11,
    RuneCharges = 12,
    ExtHouseFile = 13,
    HouseDoorId = 14,
    Count = 15,
    Duration = 16,
    DecayingState = 17,
    WrittenDate = 18,
    WrittenBy = 19,
    SleeperGuid = 20,
    SleepStart = 21,
    Charges = 22,
    ExtSpawnNpcFile = 23,
    AttributeMap = 128,
}

impl AttributeType {
    fn from_u8(value: u8) -> Option<Self> {
        match value {
            1 => Some(AttributeType::Description),
            2 => Some(AttributeType::ExtFile),
            3 => Some(AttributeType::TileFlags),
            4 => Some(AttributeType::ActionId),
            5 => Some(AttributeType::UniqueId),
            6 => Some(AttributeType::Text),
            7 => Some(AttributeType::Desc),
            8 => Some(AttributeType::TeleDest),
            9 => Some(AttributeType::Item),
            10 => Some(AttributeType::DepotId),
            11 => Some(AttributeType::ExtSpawnFile),
            12 => Some(AttributeType::RuneCharges),
            13 => Some(AttributeType::ExtHouseFile),
            14 => Some(AttributeType::HouseDoorId),
            15 => Some(AttributeType::Count),
            16 => Some(AttributeType::Duration),
            17 => Some(AttributeType::DecayingState),
            18 => Some(AttributeType::WrittenDate),
            19 => Some(AttributeType::WrittenBy),
            20 => Some(AttributeType::SleeperGuid),
            21 => Some(AttributeType::SleepStart),
            22 => Some(AttributeType::Charges),
            23 => Some(AttributeType::ExtSpawnNpcFile),
            128 => Some(AttributeType::AttributeMap),
            _ => None,
        }
    }
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone)]
pub struct Position {
    pub x: u16,
    pub y: u16,
    pub z: u8,
}

#[derive(Debug, Clone)]
pub struct Item {
    pub id: u16,
    pub attributes: HashMap<AttributeType, Vec<u8>>,
}

#[derive(Debug, Clone)]
pub struct Tile {
    pub pos: Position,
    pub house_id: Option<u32>,
    pub flags: u32,
    pub items: Vec<Item>,
}

impl Tile {
    pub fn new(pos: Position) -> Self {
        Tile {
            pos,
            house_id: None,
            flags: 0,
            items: Vec::new(),
        }
    }

    /// Add item to tile following RME's Tile::addItem() logic
    /// From RME tile.cpp:
    /// - Ground items replace existing ground
    /// - alwaysOnBottom items are inserted in sorted order by topOrder
    /// - Regular items are appended to the end
    pub fn add_item(&mut self, item: Item) {
        // For now, just append - we'll sort during rendering based on appearances.dat flags
        // This preserves OTBM file order which is critical
        self.items.push(item);
    }
}

#[derive(Debug, Clone)]
pub struct Town {
    pub id: u32,
    pub name: String,
    pub temple_pos: Position,
}

#[derive(Debug, Clone)]
pub struct Waypoint {
    pub name: String,
    pub pos: Position,
}

#[derive(Debug, Clone)]
pub struct OtbmMap {
    pub version: u32,
    pub width: u16,
    pub height: u16,
    pub description: String,
    pub tiles: HashMap<(u16, u16, u8), Tile>,
    pub towns: Vec<Town>,
    pub waypoints: Vec<Waypoint>,
}

// ============================================================================
// BINARY READER
// ============================================================================

struct OtbmReader<R: Read> {
    reader: R,
}

impl<R: Read> OtbmReader<R> {
    fn new(reader: R) -> Self {
        OtbmReader { reader }
    }

    /// Read a single byte, handling escape characters
    /// RME uses NODE_ESCAPE_CHAR (0xFD) to escape special bytes
    fn read_byte(&mut self) -> io::Result<u8> {
        let byte = self.reader.read_u8()?;
        if byte == ESCAPE_CHAR {
            self.reader.read_u8()
        } else {
            Ok(byte)
        }
    }

    /// Peek next byte without consuming it
    fn peek_byte(&mut self) -> io::Result<u8> {
        // This is tricky without seek... we'll need to redesign
        // For now, we'll use a different approach
        unimplemented!("peek_byte needs cursor-based implementation")
    }

    fn read_u16(&mut self) -> io::Result<u16> {
        let low = self.read_byte()?;
        let high = self.read_byte()?;
        Ok(u16::from_le_bytes([low, high]))
    }

    fn read_u32(&mut self) -> io::Result<u32> {
        let mut bytes = [0u8; 4];
        for i in 0..4 {
            bytes[i] = self.read_byte()?;
        }
        Ok(u32::from_le_bytes(bytes))
    }

    fn read_string(&mut self) -> io::Result<String> {
        let len = self.read_u16()? as usize;
        let mut bytes = vec![0u8; len];
        for i in 0..len {
            bytes[i] = self.read_byte()?;
        }
        Ok(String::from_utf8_lossy(&bytes).to_string())
    }
}

// ============================================================================
// PARSER
// ============================================================================

pub struct OtbmParser {
    data: Vec<u8>,
    pos: usize,
}

impl OtbmParser {
    pub fn new(data: Vec<u8>) -> io::Result<Self> {
        Ok(OtbmParser { data, pos: 0 })
    }

    pub fn from_file(path: &std::path::Path) -> io::Result<Self> {
        let data = std::fs::read(path)?;

        // Try to decompress if it's gzipped
        let decompressed = match GzDecoder::new(&data[..]).read_to_end(&mut Vec::new()) {
            Ok(_) => {
                let mut decoder = GzDecoder::new(&data[..]);
                let mut decompressed = Vec::new();
                decoder.read_to_end(&mut decompressed)?;
                decompressed
            }
            Err(_) => data,
        };

        Self::new(decompressed)
    }

    /// Read byte handling escape characters
    fn read_byte(&mut self) -> io::Result<u8> {
        if self.pos >= self.data.len() {
            return Err(io::Error::new(io::ErrorKind::UnexpectedEof, "End of data"));
        }

        let byte = self.data[self.pos];
        self.pos += 1;

        if byte == ESCAPE_CHAR {
            if self.pos >= self.data.len() {
                return Err(io::Error::new(io::ErrorKind::UnexpectedEof, "Escape char at EOF"));
            }
            let escaped = self.data[self.pos];
            self.pos += 1;
            Ok(escaped)
        } else {
            Ok(byte)
        }
    }

    fn peek_byte(&mut self) -> io::Result<u8> {
        if self.pos >= self.data.len() {
            return Err(io::Error::new(io::ErrorKind::UnexpectedEof, "End of data"));
        }
        Ok(self.data[self.pos])
    }

    fn read_u16(&mut self) -> io::Result<u16> {
        let low = self.read_byte()?;
        let high = self.read_byte()?;
        Ok(u16::from_le_bytes([low, high]))
    }

    fn read_u32(&mut self) -> io::Result<u32> {
        let mut bytes = [0u8; 4];
        for i in 0..4 {
            bytes[i] = self.read_byte()?;
        }
        Ok(u32::from_le_bytes(bytes))
    }

    fn read_string(&mut self) -> io::Result<String> {
        let len = self.read_u16()? as usize;
        let mut bytes = vec![0u8; len];
        for i in 0..len {
            bytes[i] = self.read_byte()?;
        }
        Ok(String::from_utf8_lossy(&bytes).to_string())
    }

    fn expect_node_start(&mut self) -> io::Result<NodeType> {
        let byte = self.read_byte()?;
        if byte != NODE_START {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Expected NODE_START (0xFE), got 0x{:02X}", byte),
            ));
        }

        let node_type_byte = self.read_byte()?;
        NodeType::from_u8(node_type_byte).ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Unknown node type: {}", node_type_byte),
            )
        })
    }

    fn expect_node_end(&mut self) -> io::Result<()> {
        let byte = self.read_byte()?;
        if byte != NODE_END {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Expected NODE_END (0xFF), got 0x{:02X}", byte),
            ));
        }
        Ok(())
    }

    fn skip_node(&mut self) -> io::Result<()> {
        let mut depth = 1;
        while depth > 0 {
            let byte = self.read_byte()?;
            match byte {
                NODE_START => depth += 1,
                NODE_END => depth -= 1,
                _ => {}
            }
        }
        Ok(())
    }

    /// Parse the OTBM file
    pub fn parse(&mut self) -> io::Result<OtbmMap> {
        // Read and verify signature
        let mut sig = [0u8; 4];
        for i in 0..4 {
            sig[i] = self.data[self.pos];
            self.pos += 1;
        }

        // Check for OTBM signature or zero header
        if &sig != OTBM_SIGNATURE {
            let sig_value = u32::from_le_bytes(sig);
            if sig_value != 0 {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    format!("Invalid OTBM signature: expected 'OTBM' or 0x00000000, got {:?}", sig),
                ));
            }
        }

        // Read root node
        let root_type = self.expect_node_start()?;
        if root_type != NodeType::Root {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Expected Root node, got {:?}", root_type),
            ));
        }

        // Read version
        let version = self.read_u32()?;
        log::info!("OTBM Version: {}", version);

        // Read map dimensions
        let width = self.read_u16()?;
        let height = self.read_u16()?;
        log::info!("Map dimensions: {}x{}", width, height);

        // Read major/minor items version
        let major_items = self.read_u32()?;
        let minor_items = self.read_u32()?;
        log::info!("Items version: {}.{}", major_items, minor_items);

        let mut map = OtbmMap {
            version,
            width,
            height,
            description: String::new(),
            tiles: HashMap::new(),
            towns: Vec::new(),
            waypoints: Vec::new(),
        };

        // Read map data node
        let map_data_type = self.expect_node_start()?;
        if map_data_type != NodeType::MapData {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Expected MapData node, got {:?}", map_data_type),
            ));
        }

        // Read map attributes
        loop {
            let next = self.peek_byte()?;
            if next == NODE_START || next == NODE_END {
                break;
            }

            let attr_type = self.read_byte()?;
            match AttributeType::from_u8(attr_type) {
                Some(AttributeType::Description) => {
                    map.description = self.read_string()?;
                    log::info!("Map description: {}", map.description);
                }
                _ => {
                    // Skip unknown attributes
                    let len = self.read_u16()? as usize;
                    for _ in 0..len {
                        self.read_byte()?;
                    }
                }
            }
        }

        // Read child nodes (tile areas, towns, waypoints)
        let mut tiles_processed = 0;
        let mut last_log = 0;
        while self.peek_byte()? == NODE_START {
            let node_type = self.expect_node_start()?;

            match node_type {
                NodeType::TileArea => {
                    self.parse_tile_area(&mut map)?;
                    self.expect_node_end()?; // End of TileArea

                    tiles_processed = map.tiles.len();
                    if tiles_processed - last_log >= 10000 {
                        log::info!("Processed {} tiles...", tiles_processed);
                        last_log = tiles_processed;
                    }
                }
                NodeType::Towns => {
                    self.parse_towns(&mut map)?;
                    self.expect_node_end()?; // End of Towns
                }
                NodeType::Waypoints => {
                    self.parse_waypoints(&mut map)?;
                    self.expect_node_end()?; // End of Waypoints
                }
                _ => {
                    self.skip_node()?; // skip_node already consumes NODE_END
                }
            }
        }

        self.expect_node_end()?; // End of MapData
        self.expect_node_end()?; // End of Root

        log::info!(
            "Map loaded successfully: {} tiles, {} towns, {} waypoints",
            map.tiles.len(),
            map.towns.len(),
            map.waypoints.len()
        );

        Ok(map)
    }

    fn parse_tile_area(&mut self, map: &mut OtbmMap) -> io::Result<()> {
        // Read base coordinates
        let base_x = self.read_u16()?;
        let base_y = self.read_u16()?;
        let base_z = self.read_byte()?;

        // Read tiles in this area
        while self.peek_byte()? == NODE_START {
            let node_type = self.expect_node_start()?;

            let is_house_tile = node_type == NodeType::HouseTile;
            if node_type != NodeType::Tile && !is_house_tile {
                self.skip_node()?; // skip_node already consumes NODE_END
                continue;
            }

            // Read tile position offset
            let offset_x = self.read_byte()? as u16;
            let offset_y = self.read_byte()? as u16;

            let pos = Position {
                x: base_x + offset_x,
                y: base_y + offset_y,
                z: base_z,
            };

            let mut tile = Tile::new(pos.clone());

            // Read house ID if house tile
            if is_house_tile {
                tile.house_id = Some(self.read_u32()?);
            }

            // Read tile attributes
            loop {
                let next = self.peek_byte()?;
                if next == NODE_START || next == NODE_END {
                    break;
                }

                let attr_type = self.read_byte()?;
                match AttributeType::from_u8(attr_type) {
                    Some(AttributeType::TileFlags) => {
                        tile.flags = self.read_u32()?;
                    }
                    Some(AttributeType::Item) => {
                        // Inline item (OTBM_ATTR_ITEM)
                        let item_id = self.read_u16()?;
                        let item = Item {
                            id: item_id,
                            attributes: HashMap::new(),
                        };
                        tile.add_item(item);
                    }
                    Some(_) => {
                        // Known attribute type but not handled for tiles
                        log::warn!("Unhandled tile attribute: 0x{:02X} at tile {}:{}:{} - stopping attribute reading", attr_type, pos.x, pos.y, pos.z);

                        // Put the byte back
                        self.pos -= 1;
                        if self.pos > 0 && self.data[self.pos - 1] == ESCAPE_CHAR {
                            self.pos -= 1;
                        }
                        break;
                    }
                    None => {
                        // Unknown attribute
                        log::warn!("Unknown tile attribute: 0x{:02X} at tile {}:{}:{} - stopping attribute reading", attr_type, pos.x, pos.y, pos.z);

                        // Put the byte back
                        self.pos -= 1;
                        if self.pos > 0 && self.data[self.pos - 1] == ESCAPE_CHAR {
                            self.pos -= 1;
                        }
                        break;
                    }
                }
            }

            // Read item child nodes
            while self.peek_byte()? == NODE_START {
                let node_type = self.expect_node_start()?;

                if node_type == NodeType::Item {
                    let item = self.parse_item()?;
                    tile.add_item(item);
                    self.expect_node_end()?; // parse_item() doesn't consume NODE_END
                } else {
                    self.skip_node()?; // skip_node() already consumes NODE_END
                }
            }

            // Store tile
            map.tiles.insert((pos.x, pos.y, pos.z), tile);
            self.expect_node_end()?; // End of Tile
        }

        Ok(())
    }

    fn parse_item(&mut self) -> io::Result<Item> {
        let item_id = self.read_u16()?;
        let mut item = Item {
            id: item_id,
            attributes: HashMap::new(),
        };

        // Read item attributes
        loop {
            let next = self.peek_byte()?;
            if next == NODE_START || next == NODE_END {
                break;
            }

            let attr_type_byte = self.read_byte()?;
            if let Some(attr_type) = AttributeType::from_u8(attr_type_byte) {
                // Read attribute value
                let value = match attr_type {
                    AttributeType::Count
                    | AttributeType::Charges
                    | AttributeType::RuneCharges => {
                        vec![self.read_byte()?]
                    }
                    AttributeType::ActionId
                    | AttributeType::UniqueId
                    | AttributeType::DepotId
                    | AttributeType::HouseDoorId => {
                        let val = self.read_u16()?;
                        val.to_le_bytes().to_vec()
                    }
                    AttributeType::Text
                    | AttributeType::Desc
                    | AttributeType::WrittenBy => {
                        let s = self.read_string()?;
                        s.into_bytes()
                    }
                    AttributeType::AttributeMap => {
                        // Read raw attribute map data
                        let len = self.read_u16()? as usize;
                        let mut data = vec![0u8; len + 2]; // Include length prefix
                        data[0..2].copy_from_slice(&(len as u16).to_le_bytes());
                        for i in 0..len {
                            data[i + 2] = self.read_byte()?;
                        }
                        data
                    }
                    _ => {
                        // Generic attribute reading
                        let len = self.read_u16()? as usize;
                        let mut data = Vec::with_capacity(len);
                        for _ in 0..len {
                            data.push(self.read_byte()?);
                        }
                        data
                    }
                };

                item.attributes.insert(attr_type, value);
            } else {
                // Unknown attribute type - this might be corrupt data or new attribute format
                // Don't try to read it - just stop reading attributes
                log::warn!("Unknown item attribute: 0x{:02X} for item id {} - stopping attribute reading", attr_type_byte, item.id);

                // Put the byte back by rewinding position
                self.pos -= 1;
                if self.pos > 0 && self.data[self.pos - 1] == ESCAPE_CHAR {
                    self.pos -= 1; // Also rewind the escape char
                }

                // Exit attribute loop
                break;
            }
        }

        // Read child items (for containers like bags, backpacks, etc)
        while self.peek_byte()? == NODE_START {
            let node_type = self.expect_node_start()?;

            if node_type == NodeType::Item {
                // Recursively parse child item
                let _child_item = self.parse_item()?;
                self.expect_node_end()?;
                // Note: We're not storing child items in the Item struct yet
                // The Item struct would need a Vec<Item> field for that
                // For now we just skip them to maintain file structure
            } else {
                self.skip_node()?;
            }
        }

        Ok(item)
    }

    fn parse_towns(&mut self, map: &mut OtbmMap) -> io::Result<()> {
        while self.peek_byte()? == NODE_START {
            let node_type = self.expect_node_start()?;

            if node_type != NodeType::Town {
                self.skip_node()?; // skip_node already consumes NODE_END
                continue;
            }

            let town_id = self.read_u32()?;
            let name = self.read_string()?;
            let x = self.read_u16()?;
            let y = self.read_u16()?;
            let z = self.read_byte()?;

            map.towns.push(Town {
                id: town_id,
                name,
                temple_pos: Position { x, y, z },
            });

            self.expect_node_end()?;
        }

        Ok(())
    }

    fn parse_waypoints(&mut self, map: &mut OtbmMap) -> io::Result<()> {
        while self.peek_byte()? == NODE_START {
            let node_type = self.expect_node_start()?;

            if node_type != NodeType::Waypoint {
                log::debug!("Skipping unknown waypoints child: {:?}", node_type);
                self.skip_node()?; // skip_node already consumes NODE_END
                continue;
            }

            let name = self.read_string()?;
            let x = self.read_u16()?;
            let y = self.read_u16()?;
            let z = self.read_byte()?;

            map.waypoints.push(Waypoint {
                name,
                pos: Position { x, y, z },
            });

            self.expect_node_end()?;
        }

        Ok(())
    }
}
