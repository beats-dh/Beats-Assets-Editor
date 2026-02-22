fn main() {
    println!("cargo:rerun-if-changed=protobuf/");
    
    // Usa o protoc vendorizado (não depende de protobuf-compiler do SO)
    let protoc = protoc_bin_vendored::protoc_bin_path().expect("vendored protoc not found");
    std::env::set_var("PROTOC", protoc);

    // Compile protobuf files
    let out_dir = std::env::var("OUT_DIR").expect("OUT_DIR not set");

    prost_build::Config::new()
        .out_dir(&out_dir)
        .compile_protos(
            &[
                "protobuf/appearances.proto",
                "protobuf/sounds.proto",
                "protobuf/sounds-common.proto",
                "protobuf/map.proto",
                "protobuf/shared.proto",
            ],
            &["protobuf"],
        )
        .expect("Failed to compile protobuf files");


    tauri_build::build()
}
 
