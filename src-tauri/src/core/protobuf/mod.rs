// Include the generated protobuf code

#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod shared {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.shared.rs"));
}

#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod appearances {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.appearances.rs"));
}

#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod sound {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.sound.rs"));
}

#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod map {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.map.rs"));
}

#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod minimap {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.minimap.rs"));
}

#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod staticdata {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.staticdata.rs"));
}

// Newer-client staticdata schema (incompatible field numbers vs `staticdata`).
#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod staticdata_new {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.staticdata_new.rs"));
}

#[allow(non_snake_case)]
#[allow(clippy::all)]
pub mod staticmapdata {
    include!(concat!(env!("OUT_DIR"), "/tibia.protobuf.staticmapdata.rs"));
}

pub use appearances::*;
pub use shared::*;
