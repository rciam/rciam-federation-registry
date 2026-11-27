import { getDeviceCodeValidityLimits } from "./deviceCodeValidity.js";

describe("device-code validity limits", () => {
  it("uses the tenant-configured limits", () => {
    const formConfig = {
      more_info: {
        device_code_validity_seconds: { min: 10, max: 30000 },
      },
    };

    expect(getDeviceCodeValidityLimits(formConfig)).toEqual({
      min: 10,
      max: 30000,
    });
  });

  it("matches the backend defaults when limits are not configured", () => {
    expect(getDeviceCodeValidityLimits({})).toEqual({ min: 1, max: 1800 });
  });
});
