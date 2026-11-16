import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Formik } from "formik";
import { tenantContext } from "../context.js";
import { RefreshToken } from "./Inputs.js";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key, i18n: {} }),
}));

const tenant = {
  form_config: {
    disabled_fields: [],
    more_info: { refresh_token_validity_seconds: {} },
  },
};

const baseProps = {
  values: {
    scope: ["offline_access"],
    reuse_refresh_token: false,
    clear_access_tokens_on_refresh: false,
    refresh_token_validity_seconds: 3600,
  },
  changed: null,
  disabled: false,
  description: "",
  errors: {},
  isInvalid: false,
  onBlur: jest.fn(),
  onChange: jest.fn(),
  setFieldValue: jest.fn(() => Promise.resolve()),
  validateField: jest.fn(),
};

function renderRefreshToken(container, props = {}) {
  act(() => {
    ReactDOM.render(
      <tenantContext.Provider value={[tenant, jest.fn()]}>
        <Formik initialValues={baseProps.values} onSubmit={jest.fn()}>
          <RefreshToken {...baseProps} {...props} />
        </Formik>
      </tenantContext.Provider>,
      container,
    );
  });
}

describe("RefreshToken service-type configuration", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it("shows an enabled reuse field by default", () => {
    renderRefreshToken(container);
    expect(container.querySelector('[name="reuse_refresh_token"]')).not.toBeNull();
    expect(container.querySelector('[name="reuse_refresh_token"]').disabled).toBe(false);
  });

  it("hides the reuse field and warning when configured", () => {
    renderRefreshToken(container, { reuseRefreshTokenHidden: true });
    expect(container.querySelector('[name="reuse_refresh_token"]')).toBeNull();
    expect(container.querySelector(".reuse-warning")).toBeNull();
  });

  it("keeps the reuse field visible but read-only when disabled", () => {
    renderRefreshToken(container, { reuseRefreshTokenDisabled: true });
    expect(container.querySelector('[name="reuse_refresh_token"]').disabled).toBe(true);
    expect(container.querySelector(".reuse-warning")).not.toBeNull();
  });

  it("updates rendering when the selected service type changes", () => {
    renderRefreshToken(container, { reuseRefreshTokenHidden: true });
    expect(container.querySelector('[name="reuse_refresh_token"]')).toBeNull();

    renderRefreshToken(container, {
      reuseRefreshTokenHidden: false,
      reuseRefreshTokenDisabled: true,
    });
    expect(container.querySelector('[name="reuse_refresh_token"]').disabled).toBe(true);
  });
});
