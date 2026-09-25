import { describe, expect, it } from "vitest";
import { mapWheelVariant } from "./mapWheel";

describe("mapWheelVariant", () => {
  it("keeps a numeric price stored as text", () => {
    expect(
      mapWheelVariant({
        id: 4,
        wheel_model_id: 2,
        size_label: "22.5x9.00",
        sku: null,
        diameter: "22.5",
        width: null,
        bolt_holes: null,
        pcd: "10x335",
        pcd_mm: null,
        offset_e_t: "0",
        center_bore: "281",
        load_rating: null,
        weight: null,
        color: "silver",
        finish: null,
        fastener_type: null,
        fastener_material: null,
        source_specification: null,
        compatible_tire_sizes: null,
        available: null,
        price: "18400.00",
        price_on_request: false,
      }),
    ).toMatchObject({
      id: "4",
      modelId: "2",
      price: 18400,
      priceOnRequest: false,
      available: true,
      diameter: 22.5,
      offsetET: 0,
      centerBore: 281,
    });
  });
});
