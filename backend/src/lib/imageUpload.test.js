const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { inspectImageUpload } = require("./imageUpload");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const HEIC = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
]);
const PDF = Buffer.from("%PDF-1.4");

describe("POST /upload image gate", () => {
  it("accepts jpeg, png and webp and fixes an empty iPhone mime", () => {
    const jpeg = inspectImageUpload(JPEG, "", "IMG_2048.JPG");
    assert.equal(jpeg.mimetype, "image/jpeg");
    assert.equal(jpeg.filename, "IMG_2048.jpg");

    const png = inspectImageUpload(PNG, "application/octet-stream", "foto.png");
    assert.equal(png.mimetype, "image/png");

    const webp = inspectImageUpload(WEBP, "", "foto.webp");
    assert.equal(webp.mimetype, "image/webp");
  });

  it("rejects raw HEIC instead of storing a broken image", () => {
    const labeled = inspectImageUpload(HEIC, "image/heic", "IMG_2048.HEIC");
    assert.match(labeled.error, /HEIC/);

    const mislabeled = inspectImageUpload(HEIC, "image/jpeg", "foto.jpg");
    assert.match(mislabeled.error, /HEIC/);
    assert.equal(mislabeled.mimetype, undefined);

    const mif1 = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31,
    ]);
    assert.match(inspectImageUpload(mif1, "", "IMG.HEIF").error, /HEIC/);
  });

  it("rejects non-images with a clear message", () => {
    const pdf = inspectImageUpload(PDF, "application/pdf", "doc.pdf");
    assert.match(pdf.error, /JPG, PNG o WebP/);
    const disguised = inspectImageUpload(PDF, "image/jpeg", "foto.jpg");
    assert.match(disguised.error, /JPG, PNG o WebP/);
    assert.equal(disguised.mimetype, undefined);
    const empty = inspectImageUpload(Buffer.alloc(0), "image/jpeg", "x.jpg");
    assert.match(empty.error, /imagen/);
  });

  it("accepts real jpeg, png and webp files with an empty mime", () => {
    const jpeg = Buffer.from(
      "ffd8ffe000104a46494600010200000100010000fffe00104c61766336302e33312e31303200ffdb0043000804040404040505050505050606060606060606060606060607070708080807070706060707080808080909090808080809090a0a0a0c0c0b0b0e0e0e111114ffc4004d000101000000000000000000000000000000060101010100000000000000000000000000000607100100000000000000000000000000000000110100000000000000000000000000000000ffc00011080040004003012200021100031100ffda000c03010002110311003f008b0128dfc000000000000000000000000000000000000000000001ffd9",
      "hex"
    );
    const png = Buffer.from(
      "89504e470d0a1a0a0000000d4948445200000040000000400802000000250be68900000009704859730000000100000001004f25c4d60000007049444154789cedcf010900000c84c0efdf79b01822081740779b1a5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd0801c5fd080dc035ca0d0e2bb6bd3770000000049454e44ae426082",
      "hex"
    );
    const webp = Buffer.from(
      "524946465a00000057454250565038204e000000f003009d012a400040003e9148a04c25a42322220800b012096900d3ca8000103b93c116da67710000feeed3dfff80dd7c5b4cbfff7381ff7381ff7381fc6d4326178e9af219737c3e2990000000",
      "hex"
    );
    assert.equal(inspectImageUpload(jpeg, "", "IMG_2048").mimetype, "image/jpeg");
    assert.equal(inspectImageUpload(png, "", "foto").mimetype, "image/png");
    assert.equal(inspectImageUpload(webp, "", "foto.heic").mimetype, "image/webp");
  });
});
