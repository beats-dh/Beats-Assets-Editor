// Include the generated protobuf code
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

pub use appearances::*;
