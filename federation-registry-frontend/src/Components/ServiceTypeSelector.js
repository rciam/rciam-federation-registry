// Components/ServiceTypeSelector.js

import React from "react";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCogs,
  faShieldAlt,
  faSlidersH,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

const serviceTypes = [
  {
    value: "machine_to_machine",
    title: "service_type_m2m",
    description: "service_type_m2m_description",
    details: "service_type_m2m_details",
    icon: faCogs,
  },
  {
    value: "resource_server",
    title: "service_type_resource_server",
    description: "service_type_resource_server_description",
    details: "service_type_resource_server_details",
    icon: faShieldAlt,
  },
  {
    value: "advanced",
    title: "service_type_advanced",
    description: "service_type_advanced_description",
    details: "service_type_advanced_details",
    icon: faSlidersH,
  },
];

const ServiceTypeSelector = ({
  value,
  onChange,
  editable = false,
  order = [],
}) => {
  const { t } = useTranslation();
  const configuredOrder = Array.isArray(order) ? order : [];

  const orderedServiceTypes = [
    ...configuredOrder
      .map((serviceType) =>
        serviceTypes.find((candidate) => candidate.value === serviceType),
      )
      .filter(
        (serviceType, index, ordered) =>
          serviceType && ordered.indexOf(serviceType) === index,
    ),
    ...serviceTypes.filter(
      (serviceType) => !configuredOrder.includes(serviceType.value),
    ),
  ];

  const selectedType = serviceTypes.find(
    (serviceType) => serviceType.value === value,
  );

  if (!editable) {
    if (!selectedType) {
      return null;
    }

    return (
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex align-items-start">
            <FontAwesomeIcon
              icon={selectedType.icon}
              size="2x"
              className="text-primary mr-3"
            />

            <div>
              <strong>{t(selectedType.title)}</strong>

              <div className="text-muted">{t(selectedType.description)}</div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="mb-4">
      {!value && (
        <Alert variant="primary" className="service-type-select-alert">
          <div className="d-flex align-items-start">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-3 mt-1" />

            <div>
              <strong>{t("service_type_select_title")}</strong>
              <div>{t("service_type_select_description")}</div>
            </div>
          </div>
        </Alert>
      )}

      <div className="mb-3">
        <h5>
          {t("service_type")}
          <span className="text-danger"> *</span>
        </h5>

        <div className="text-muted">{t("service_type_description")}</div>
      </div>

      <Row className="service-type-row">
        {orderedServiceTypes.map((serviceType) => {
          const selected = value === serviceType.value;

          return (
            <Col key={serviceType.value} md={4} className="mb-3">
              <Card
                className={`h-100 service-type-card ${
                  selected ? "border-primary" : ""
                }`}
                onClick={() => onChange(serviceType.value)}
              >
                <Card.Body>
                  <div className="d-flex align-items-start">
                    <FontAwesomeIcon
                      icon={serviceType.icon}
                      size="2x"
                      className="text-primary mr-3"
                    />

                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <strong>{t(serviceType.title)}</strong>

                        <Form.Check type="radio" checked={selected} readOnly />
                      </div>
                      <div className="text-muted mt-2">
                        {t(serviceType.description)}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Alert variant="warning" className="mt-3 mb-0 py-2">
        <strong>{t("service_type_help_title")}</strong>
        <div className="small">{t("service_type_help_description")}</div>
      </Alert>
    </div>
  );
};

export default ServiceTypeSelector;
