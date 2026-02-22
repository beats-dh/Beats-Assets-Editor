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

pub use appearances::*;
pub use shared::*;

