const {QueryFile} = require('pg-promise');
const path = require('path');

///////////////////////////////////////////////////////////////////////////////////////////////
// Criteria for deciding whether to place a particular query into an external SQL file or to
// keep it in-line (hard-coded):
//
// - Size / complexity of the query, because having it in a separate file will let you develop
//   the query and see the immediate updates without having to restart your application.
//
// - The necessity to document your query, and possibly keeping its multiple versions commented
//   out in the query file.
//
// In fact, the only reason one might want to keep a query in-line within the code is to be able
// to easily see the relation between the query logic and its formatting parameters. However, this
// is very easy to overcome by using only Named Parameters for your query formatting.
////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = {
    service_details:{
      add:sql('service_details/add.sql'),
      update:sql('service_details/update.sql')
    },
    service_details_protocol:{
      addOidc:sql('service_details_protocol/addOidc.sql'),
      checkClientId:sql('service_details_protocol/checkClientId.sql'),
      checkClientIdAllEnvironments:sql('service_details_protocol/checkClientIdAllEnvironments.sql'),
      updateOidc:sql('service_details_protocol/updateOidc.sql'),
      updateSaml:sql('service_details_protocol/updateSaml.sql'),
      checkEntityId:sql('service_details_protocol/checkEntityId.sql'),
      checkEntityIdAllEnvironments:sql('service_details_protocol/checkEntityIdAllEnvironments.sql'),
      addSaml:sql('service_details_protocol/addSaml.sql')
    },
    service:{
      getAll:(sql('service/getAll.sql')),
      getService:sql('service/getService.sql'),
      getPending:sql('service/getPending.sql'),
      getContacts:sql('service/getContacts.sql')
    },
    user_info:{
      add:sql('user_info/add.sql'),
      update:sql('user_info/update.sql')
    },
    service_petition_details:{
      add:sql('service_petition_details/add.sql'),
      update:sql('service_petition_details/update.sql'),
      getTicketInfo:sql('service_petition_details/getTicketInfo.sql'),
      canBeEditedByRequester:sql('service_petition_details/canBeEditedByRequester.sql'),
      belongsToRequester:sql('service_petition_details/belongsToRequester.sql')
    },
    service_state:{
      add:sql('service_state/add.sql'),
      update:sql('service_state/update.sql'),
      getOutdatedOwners:sql('service_state/getOutdatedOwners.sql'),
      getOutdatedServices:sql('service_state/getOutdatedServices.sql')
    },
    user:{
      getTenchicalContacts: sql('user/getTenchicalContacts.sql'),
      getUser:sql('user/getUser.sql'),
      getServiceOwners:sql('user/getServiceOwners.sql'),
      getPetitionOwners:sql('user/getPetitionOwners.sql'),
      getUsersByAction:sql('user/getUsersByAction.sql')
    },
    petition: {
      getPetition:sql('petition/getPetition.sql'),
      getOwnPetition:sql('petition/getOwnPetition.sql'),
      canReviewOwn:sql('petition/canReviewOwn.sql'),
      getOldOwnPetition:sql('petition/getOldOwnPetition.sql'),
      getOldPetition:sql('petition/getOldPetition.sql'),
      getLastStateId:sql('petition/getLastStateId.sql')
    },
    service_list: {
      getList:sql('service_list/getList.sql')
    },
    group: {
      getGroupMembers:(sql('group/getGroupMembers.sql')),
      getGroupManagers:(sql('group/getGroupManagers.sql'))
    },
    invitations: {
      getAll:(sql('invitations/getAll.sql')),
      get:(sql('invitations/get.sql')),
      getOne:(sql('invitations/getOne.sql'))

    },
    organizations: {
      getById:(sql('organizations/getById.sql')),
      get:(sql('organizations/get.sql')),
      delete:(sql('organizations/delete.sql')),
      update:(sql('organizations/update.sql')),
      add:(sql('organizations/add.sql'))
    },
    service_tags: {
      getAll:(sql('service_tags/getAll.sql')),
      getByServiceId: (sql('service_tags/getByServiceId.sql'))
    }
};

///////////////////////////////////////////////
// Helper for linking to external query files;
function sql(file) {

    const fullPath = path.join(__dirname, file); // generating full path;

    const options = {
        // minifying the SQL is always advised;
        // see also option 'compress' in the API;
        minify: true

        // See also property 'params' for two-step template formatting
    };

    const qf = new QueryFile(fullPath, options);

    if (qf.error) {
        // Something is wrong with our query file :(
        // Testing all files through queries can be cumbersome,
        // so we also report it here, while loading the module:
        console.error(qf.error);
    }

    return qf;

    // See QueryFile API:
    // http://vitaly-t.github.io/pg-promise/QueryFile.html
}

///////////////////////////////////////////////////////////////////
// Possible alternative - enumerating all SQL files automatically:
// http://vitaly-t.github.io/pg-promise/utils.html#.enumSql
