import React, { useEffect, useState, useContext } from "react";
import initialValues from "./initialValues";
import { useParams, useHistory } from "react-router-dom";
import config from "./config.json";
import ServiceForm from "./ServiceForm.js";
import DeploymentTroubleshooting from "./Components/DeploymentTroubleshooting.js";
import { LoadingBar } from "./Components/LoadingBar";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  Logout,
  NotFound,
  ConfirmationModal,
  ResponseModal,
} from "./Components/Modals";
import { diff } from "deep-diff";
import { useTranslation } from "react-i18next";
import { tenantContext, userContext } from "./context.js";
import { calcDiff } from "./helpers.js";

const EditService = (props) => {
  let history = useHistory();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [petitionData, setPetitionData] = useState();
  const [service, setService] = useState();
  const [editPetition, setEditPetition] = useState();
  const [changes, setChanges] = useState();
  const { tenant_name } = useParams();
  const { service_id } = useParams();
  const { petition_id } = useParams();
  const [logout, setLogout] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [tenant] = useContext(tenantContext);
  const [user] = useContext(userContext);
  const [owned, setOwned] = useState(true);
  const [modalMessage, setModalMessage] = useState();
  const [petitionIdRedirect, setPetitionIdRedirect] = useState();
  const [redirectTitle, setRedirectTitle] = useState();

  useEffect(() => {
    localStorage.removeItem("url");
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.review]);

  useEffect(() => {
    if (petitionData && props.review) {
      if (petitionData.metadata.status === "changes") {
        setModalMessage(
          "This request has already been reviewed and changes have been requested from the service owners",
        );
      }
      if (
        petitionData.metadata.status === "request_review" &&
        !user.actions.includes("review_restricted")
      ) {
        setModalMessage(
          "This request is under review from a different user group",
        );
      }
    }
  }, [petitionData, user, props.review]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (petitionData && service && props.review) {
      let helper = calcDiff(
        service,
        petitionData.petition,
        tenant?.form_config,
        diff,
      );
      let multivalue_attributes = [];
      for (const service_property in service)
        service[service_property] &&
          typeof service[service_property] === "object" &&
          multivalue_attributes.push(service_property);
      for (const service_property in petitionData.petition)
        petitionData.petition[service_property] &&
          typeof petitionData.petition[service_property] === "object" &&
          !multivalue_attributes.includes(service_property) &&
          multivalue_attributes.push(service_property);
      // multivalue_attributes.forEach(item=>{
      //   if(helper[item].D){
      //     petitionData.petition[item].push(...helper[item].D);
      //   }
      // });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setEditPetition(petitionData.petition);
      setChanges(helper);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petitionData, service, props.review, editPetition]);

  const getData = async () => {
    if (service_id) {
      fetch(
        config.host[tenant_name] +
          "tenants/" +
          tenant_name +
          "/services/" +
          service_id,
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          credentials: "include", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (response.status === 200 || response.status === 304) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
            return false;
          }
          if (response.status === 404) {
            setNotFound(true);
            return false;
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response) {
            setOwned(response.owned);
            setService(response.service);
          }
        });
    }
    if (service_id && !petition_id && !props.review) {
      fetch(
        config.host[tenant_name] +
          "tenants/" +
          tenant_name +
          "/services/list?service_id=" +
          service_id,
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          credentials: "include", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (response.status === 200 || response.status === 304) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
            return false;
          } else if (response.status === 416) {
            setNotFound(true);
            return false;
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response) {
            try {
              if (response.list_items[0].petition_id) {
                if (response.list_items[0].type === "edit") {
                  setPetitionIdRedirect(response.list_items[0].petition_id);
                  setRedirectTitle(
                    "There is already an open reconfiguration request for this service",
                  );
                } else if (response.list_items[0].type === "delete") {
                  setPetitionIdRedirect(response.list_items[0].petition_id);
                  setRedirectTitle(
                    "There is an open deregistration request for this service",
                  );
                }
              }
            } catch (err) {}
          }
        });
    }
    if (petition_id) {
      fetch(
        config.host[tenant_name] +
          "tenants/" +
          tenant_name +
          "/petitions/" +
          petition_id +
          "?type=open",
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          credentials: "include", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (response.status === 200 || response.status === 304) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
            return false;
          } else if (response.status === 404) {
            setNotFound(true);
            return false;
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response) {
            if (
              props.review &&
              !(
                user.actions.includes("review_petition") ||
                user.actions.includes("review_restricted") ||
                (user.actions.includes("review_own_petition") &&
                  tenant.config.test_env.includes(
                    response?.petition?.integration_environment,
                  ))
              )
            ) {
              setNotFound(true);
            } else {
              setOwned(response.metadata.owned);
              setPetitionData(response);
            }
          }
        });
    }
  };

  return (
    <React.Fragment>
      <Logout logout={logout} />
      <NotFound notFound={notFound} />
      <ResponseModal
        return_url={"/" + tenant_name + "/services"}
        message={modalMessage}
        modalTitle={"Review is not available for this request"}
      />
      <ConfirmationModal
        active={petitionIdRedirect ? true : false}
        close={() => {
          history.push("/" + tenant_name + "/services");
          setPetitionIdRedirect();
        }}
        action={() => {
          history.push(
            "/" +
              tenant_name +
              "/services/" +
              service_id +
              "/requests/" +
              petitionIdRedirect +
              "/edit",
          );
          setPetitionIdRedirect();
          window.location.reload(false);
        }}
        title={redirectTitle}
        message={"Do you want to view it?"}
        accept={"Yes"}
        decline={"No"}
      />
      {!((petitionData || !petition_id) && (!service_id || service)) ? (
        <LoadingBar loading={true} />
      ) : (
        <React.Fragment>
          {props.review ? (
            <React.Fragment>
              {petitionData.metadata.type === "edit" ? (
                <React.Fragment>
                  {editPetition && changes ? (
                    <React.Fragment>
                      <CommentsAlert
                        alert={t("reconfiguration_info")}
                        comment={petitionData.metadata.comment}
                        metadata={petitionData.metadata}
                      />
                      <ServiceForm
                        disableEnvironment={true}
                        initialValues={editPetition}
                        user={user}
                        changes={changes}
                        {...petitionData.metadata}
                        {...props}
                      />
                    </React.Fragment>
                  ) : (
                    <LoadingBar loading={true} />
                  )}
                </React.Fragment>
              ) : petitionData.metadata.type === "create" ? (
                <React.Fragment>
                  {petitionData ? (
                    <React.Fragment>
                      <CommentsAlert
                        alert=
                          {t("edit_create_info")}
                        
                        comment={petitionData.metadata.comment}
                        metadata={petitionData.metadata}
                      />
                      <ServiceForm
                        initialValues={petitionData.petition}
                        user={user}
                        {...petitionData.metadata}
                        {...props}
                      />
                    </React.Fragment>
                  ) : (
                    <LoadingBar loading={true} />
                  )}
                </React.Fragment>
              ) : (
                <React.Fragment>
                  {service ? (
                    <React.Fragment>
                      <CommentsAlert
                        alert={t("edit_delete_info")}
                        comment={petitionData.metadata.comment}
                        metadata={petitionData.metadata}
                      />
                      <ServiceForm
                        copy={true}
                        initialValues={service}
                        user={user}
                        {...petitionData.metadata}
                        {...props}
                      />
                    </React.Fragment>
                  ) : (
                    <LoadingBar loading={true} />
                  )}
                </React.Fragment>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <NotFound notAuthorised={!owned} />

              {!petitionData ? (
                <RequestedChangesAlert
                  tab1={service}
                  tab2={service}
                  {...props}
                />
              ) : petitionData.metadata.type === "edit" ? (
                <RequestedChangesAlert
                  comment={petitionData.metadata.comment}
                  tab1={petitionData.petition}
                  tab2={service}
                  {...petitionData.metadata}
                  {...props}
                />
              ) : petitionData.metadata.type === "delete" ? (
                <RequestedChangesAlert
                  comment={petitionData.metadata.comment}
                  tab1={service}
                  tab2={service}
                  {...petitionData.metadata}
                  {...props}
                />
              ) : petitionData.metadata.type === "create" ? (
                <React.Fragment>
                  {petitionData.metadata.comment ? (
                    <ReviewInfoAlert
                      title={t("edit_changes_info")}
                      comment={petitionData.metadata.comment}
                      metadata={petitionData.metadata}
                    />
                  ) : petitionData.metadata.type ? (
                    <Alert variant="warning" className="form-alert">
                      {t("edit_create_pending_info")}
                    </Alert>
                  ) : null}
                  {petitionData ? (
                    <ServiceForm
                      disableEnvironment={true}
                      initialValues={petitionData.petition}
                      {...petitionData.metadata}
                      {...props}
                    />
                  ) : (
                    <LoadingBar loading={true} />
                  )}
                </React.Fragment>
              ) : (
                <RequestedChangesAlert
                  comment={petitionData ? petitionData.metadata.comment : null}
                  tab1={service}
                  tab2={service}
                  {...petitionData.metadata}
                  {...props}
                />
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

const ViewRequest = (props) => {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [petitionData, setPetitionData] = useState();
  const [editPetition, setEditPetition] = useState();
  const [changes, setChanges] = useState();
  const { tenant_name } = useParams();
  const { service_id } = useParams();
  const { petition_id } = useParams();
  const [logout, setLogout] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [tenant] = useContext(tenantContext);
  const [service, setService] = useState();
  const [user] = useContext(userContext);

  useEffect(() => {
    localStorage.removeItem("url");
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (petitionData && service && !editPetition) {
      let helper = calcDiff(
        service,
        petitionData.petition,
        tenant?.form_config,
        diff,
      );
      let multivalue_attributes = [];
      for (const service_property in service)
        service[service_property] &&
          typeof service[service_property] === "object" &&
          multivalue_attributes.push(service_property);
      for (const service_property in petitionData.petition)
        petitionData.petition[service_property] &&
          typeof petitionData.petition[service_property] === "object" &&
          !multivalue_attributes.includes(service_property) &&
          multivalue_attributes.push(service_property);
      multivalue_attributes.forEach((item) => {
        if (helper[item].D) {
          petitionData.petition[item].push(...helper[item].D);
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setEditPetition(petitionData.petition);
      setChanges(helper);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petitionData, service, editPetition]);

  const getData = async () => {
    if (service_id) {
      fetch(
        config.host[tenant_name] +
          "tenants/" +
          tenant_name +
          "/services/" +
          service_id,
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          credentials: "include", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (response.status === 200 || response.status === 304) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
            return false;
          }
          if (response.status === 404) {
            setNotFound(true);
            return false;
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response) {
            setService(response.service);
          }
        });
    }
    if (petition_id) {
      fetch(
        config.host[tenant_name] +
          "tenants/" +
          tenant_name +
          "/petitions/" +
          petition_id +
          "?type=open",
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          credentials: "include", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (response.status === 200 || response.status === 304) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
            return false;
          } else if (response.status === 404) {
            setNotFound(true);
            return false;
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response) {
            if (!response) {
              setNotFound(true);
            } else {
              setPetitionData(response);
            }
          }
        });
    }
  };

  return (
    <React.Fragment>
      <Logout logout={logout} />
      <NotFound notFound={notFound} />
      {!((petitionData || !petition_id) && (!service_id || service)) ? (
        <LoadingBar loading={true} />
      ) : (
        <React.Fragment>
          {petitionData.metadata.type === "edit" ? (
            <React.Fragment>
              <Alert variant="warning" className="form-alert">
                {t("reconfiguration_info")} It was submitted on{" "}
                {petitionData.metadata.submitted_at.slice(12, 19)}(GMT+3) at{" "}
                {petitionData.metadata.submitted_at
                  .slice(0, 10)
                  .split("-")
                  .join("/")}
                .
              </Alert>
              {editPetition && changes ? (
                <React.Fragment>
                  <CommentsAlert
                    alert={
                      petitionData.metadata.status === "changes"
                        ? "A Reviewer has requested changes from the owners of the following request"
                        : "Review has been requested for the following request"
                    }
                    comment={petitionData.metadata.comment}
                    metadata={petitionData.metadata}
                  />
                  <ServiceForm
                    disableEnvironment={true}
                    user={user}
                    disabled={true}
                    initialValues={editPetition}
                    changes={changes}
                    {...petitionData.metadata}
                    {...props}
                  />
                </React.Fragment>
              ) : (
                <LoadingBar loading={true} />
              )}
            </React.Fragment>
          ) : petitionData.metadata.type === "create" ? (
            <React.Fragment>
              <Alert variant="warning" className="form-alert">
                {t("edit_create_info")} It was submitted on{" "}
                {petitionData.metadata.submitted_at.slice(12, 19)}(GMT+3) at{" "}
                {petitionData.metadata.submitted_at
                  .slice(0, 10)
                  .split("-")
                  .join("/")}
                .
              </Alert>
              {petitionData ? (
                <React.Fragment>
                  <CommentsAlert
                    alert={
                      petitionData.metadata.status === "changes"
                        ? "A Reviewer has requested changes from the owners of the following request"
                        : "Review has been requested for the following request"
                    }
                    comment={petitionData.metadata.comment}
                    metadata={petitionData.metadata}
                  />
                  <ServiceForm
                    initialValues={petitionData.petition}
                    user={user}
                    disabled={true}
                    {...petitionData.metadata}
                    {...props}
                  />
                </React.Fragment>
              ) : (
                <LoadingBar loading={true} />
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Alert variant="warning" className="form-alert">
                {t("edit_delete_info")} It was submitted on{" "}
                {petitionData.metadata.submitted_at.slice(12, 19)}(GMT+3) at{" "}
                {petitionData.metadata.submitted_at
                  .slice(0, 10)
                  .split("-")
                  .join("/")}
                .
              </Alert>
              {service ? (
                <React.Fragment>
                  <CommentsAlert
                    alert={
                      petitionData.metadata.status === "changes"
                        ? "A Reviewer has requested changes from the owners of the following request"
                        : "Review has been requested for the following request"
                    }
                    comment={petitionData.metadata.comment}
                    metadata={petitionData.metadata}
                  />
                  <ServiceForm
                    copy={true}
                    initialValues={service}
                    user={user}
                    disabled={true}
                    {...petitionData.metadata}
                    {...props}
                  />
                </React.Fragment>
              ) : (
                <LoadingBar loading={true} />
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

const ViewService = (props) => {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [service, setService] = useState();
  const [deploymentError, setDeploymentError] = useState();
  const { tenant_name } = useParams();
  const { petition_id } = useParams();
  const { service_id } = useParams();
  const [petitionData, setPetitionData] = useState();
  const [logout, setLogout] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [user] = useContext(userContext);
  const [serviceState, setServiceState] = useState({ owned: false, state: "" });

  useEffect(() => {
    localStorage.removeItem("url");
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getData = () => {
    if (service_id) {
      fetch(
        config.host[tenant_name] +
          "tenants/" +
          tenant_name +
          "/services/" +
          service_id,
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          credentials: "include", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (response.status === 200 || response.status === 304) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
            return false;
          } else if (response.status === 404) {
            setNotFound(true);
            return false;
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response.service) {
            setService(response.service);
            delete response.service;
            setDeploymentError(response.error);
            delete response.error;
            setServiceState(response);
          }
        });
    }
    if (petition_id) {
      fetch(
        config.host[tenant_name] +
          "tenants/" +
          tenant_name +
          "/petitions/" +
          petition_id +
          "?type=open",
        {
          method: "GET", // *GET, POST, PUT, DELETE, etc.
          credentials: "include", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (response.status === 200 || response.status === 304) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
            return false;
          } else if (response.status === 404) {
            setNotFound(true);
            return false;
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response) {
            setPetitionData(response);
          }
        });
    }
  };
  return (
    <React.Fragment>
      <NotFound notFound={notFound} />
      <Logout logout={logout} />
      {deploymentError && !user.actions.includes("error_action") ? (
        <Alert variant="primary" className="form-alert">
          The deployment for the following request could not be completed due to
          an error. Our technical team will handle this issue and you will be
          notified when it is resolved. Thank you for your patience.
        </Alert>
      ) : null}
      {serviceState.state === "waiting-deployment" ||
      serviceState.state === "pending" ? (
        <Alert variant="primary" className="form-alert">
          The deployment of the following{" "}
          {serviceState.deployment_type === "create"
            ? "registration"
            : serviceState.deployment_type === "edit"
              ? "reconfiguration"
              : serviceState.deployment_type === "delete"
                ? "deregistation"
                : null}{" "}
          request is pending.
        </Alert>
      ) : null}

      <DeploymentTroubleshooting
        deploymentState={serviceState}
        setDeploymentState={setServiceState}
        deploymentError={deploymentError}
        user={user}
        setDeploymentError={setDeploymentError}
        service_id={service_id}
        setLogout={setLogout}
      />
      {service ? (
        <React.Fragment>
          {service.created_at ? (
            <Alert variant="primary" className="form-alert">
              Service was registered at:{" "}
              <b>
                {service.created_at.slice(0, 10).split("-").join("/") +
                  " " +
                  service.created_at.slice(11, 19).split("-").join("/")}
              </b>
            </Alert>
          ) : null}
          <ServiceForm
            initialValues={service}
            user={user}
            disabled={true}
            copyButton={true}
            owned={serviceState.owned}
            {...props}
          />
        </React.Fragment>
      ) : service_id ? (
        <LoadingBar loading={true} />
      ) : petitionData ? (
        <React.Fragment>
          <Alert variant="danger" className="form-alert">
            {t("view_create_info")}
          </Alert>

          <ServiceForm
            initialValues={petitionData.petition}
            user={user}
            copyButton={true}
            owned={serviceState.owned}
            disabled={true}
            {...petitionData.metadata}
            {...props}
          />
        </React.Fragment>
      ) : petition_id ? (
        <LoadingBar loading={true} />
      ) : null}
    </React.Fragment>
  );
};
const ReviewInfoAlert = ({ title, comment, metadata }) => {
  const { t } = useTranslation();

  const formatDate = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleString();
  };

  const reviewer = metadata?.reviewer;
  const requester = metadata?.requester_info;

  if (!title && !comment && !metadata) return null;

  return (
    <Alert variant="warning" className="form-alert petition-review-alert">
      {title && <div className="mb-3">{title}</div>}

      <Card className="mt-3 petition-review-card">
        <Card.Body>
          {metadata && (
            <>
              <Row>
                {requester && (
                  <Col md={4} className="mb-3 mb-md-0">
                    <div className="text-muted small">
                      {t("history_requester")}
                    </div>
                    <div>{requester.name || requester.email || requester.sub}</div>
                    {requester.email && (
                      <div className="text-muted small">{requester.email}</div>
                    )}
                  </Col>
                )}

                {metadata.submitted_at && (
                  <Col md={4} className="mb-3 mb-md-0">
                    <div className="text-muted small">
                      {t("history_submitted_at")}
                    </div>
                    <div>{formatDate(metadata.submitted_at)}</div>
                  </Col>
                )}

                {metadata.reviewed_at && (
                  <Col md={4} className="mb-3 mb-md-0">
                    <div className="text-muted small">
                      {t("history_reviewed_at")}
                    </div>
                    <div>{formatDate(metadata.reviewed_at)}</div>
                  </Col>
                )}

                {reviewer && (
                  <Col md={4}>
                    <div className="text-muted small">
                      {t("history_reviewer")}
                    </div>
                    <div>{reviewer.name || reviewer.email || reviewer.sub}</div>
                    {reviewer.email && (
                      <div className="text-muted small">{reviewer.email}</div>
                    )}
                  </Col>
                )}
              </Row>

              {comment && <hr />}
            </>
          )}

          {comment && (
            <>
              <div className="text-muted small mb-1">{t("changes_title")}</div>
              <div className="text-comment petition-review-comment">{comment}</div>
            </>
          )}
        </Card.Body>
      </Card>
    </Alert>
  );
};

const CommentsAlert = ({ alert, comment, metadata }) => {
  return (
    <ReviewInfoAlert title={alert} comment={comment} metadata={metadata} />
  );
};

const RequestedChangesAlert = (props) => {
  const [user] = useContext(userContext);

  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  return (
    <React.Fragment>
      <Tabs
        className="edit-tabs"
        defaultActiveKey="petition"
        id="uncontrolled-tab-example"
      >
        <Tab eventKey="petition" title="Edit Request">
          {props.comment ? (
            <ReviewInfoAlert
              title={`${t("changes_info_1_1")}${props.type}${t("changes_info_1_2")}`}
              comment={props.comment}
              metadata={props.metadata}
            />
          ) : props.type ? (
            <Alert variant="warning" className="form-alert">
              {t("changes_info_2_1")}{" "}
              {props.type === "delete"
                ? "deregistration"
                : props.type === "edit"
                  ? "reconfiguration"
                  : "registration"}{" "}
              {t("changes_info_2_2")}
            </Alert>
          ) : null}
          {props.tab1 ? (
            <ServiceForm
              user={user}
              disableEnvironment={true}
              initialValues={props.tab1}
              {...props}
            />
          ) : (
            <LoadingBar loading={true} />
          )}
        </Tab>
        <Tab eventKey="service" title="View Deployed Service">
          {props.tab2 ? (
            <ServiceForm
              user={user}
              initialValues={props.tab2}
              disabled={true}
              {...props}
            />
          ) : (
            <LoadingBar loading={true} />
          )}
        </Tab>
      </Tabs>
    </React.Fragment>
  );
};

const CopyService = (props) => {
  const [service, setService] = useState();
  const { tenant_name } = useParams();
  const [logout, setLogout] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [user] = useContext(userContext);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const getData = () => {
    fetch(
      config.host[tenant_name] +
        "tenants/" +
        tenant_name +
        "/services/" +
        props.service_id,
      {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        credentials: "include", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
      .then((response) => {
        if (response.status === 200 || response.status === 304) {
          return response.json();
        } else if (response.status === 401) {
          setLogout(true);
          return false;
        }
        if (response.status === 404) {
          setNotFound(true);
          return false;
        } else {
          return false;
        }
      })
      .then((response) => {
        if (response) {
          // Updated by Jan Pavlíček (xpavli95@stud.fit.vutbr.cz) - updated the condition for clearing the service identifiers
          // with props.clear_identifier signal
          // Also added missing clearing of client id
          response.service.integration_environment =
            props.integration_environment;
          if (props.sameEnvironment || props.clear_identifier) {
            delete response.service.entity_id;
            delete response.service.client_id;
          }
          setService(response.service);
        }
      });
  };
  return (
    <React.Fragment>
      <NotFound notFound={notFound} />
      <Logout logout={logout} />
      {service ? (
        <ServiceForm user={user} initialValues={service} copy={true} />
      ) : (
        <LoadingBar loading={true} />
      )}
    </React.Fragment>
  );
};

const NewService = (props) => {
  const [tenant] = useContext(tenantContext);

  return (
    <React.Fragment>
      <ServiceForm
        user={props.user}
        initialValues={tenant?.form_config?.defaultValues || initialValues}
        {...props}
      />
    </React.Fragment>
  );
};

export { EditService, NewService, ViewService, CopyService, ViewRequest };
