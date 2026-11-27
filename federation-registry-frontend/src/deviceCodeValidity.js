export const getDeviceCodeValidityLimits = (formConfig) => ({
  min: formConfig?.more_info?.device_code_validity_seconds?.min ?? 1,
  max: formConfig?.more_info?.device_code_validity_seconds?.max ?? 1800,
});
