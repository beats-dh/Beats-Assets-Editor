fn main() {
    // Garante um `protoc` vendorizado no PATH do build
    let protoc = protoc_bin_vendored::protoc().expect("vendored protoc not found");
    std::env::set_var("PROTOC", protoc);

    // Compile protobuf files
    let out_dir = std::env::var("OUT_DIR").expect("OUT_DIR not set");

    prost_build::Config::new().out_dir(&out_dir).compile_protos(&["protobuf/appearances.proto", "protobuf/sounds.proto"], &["protobuf"]).expect("Failed to compile protobuf files");

    tauri_build::build()
}
