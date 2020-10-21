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
      updateOidc:sql('service_details_protocol/updateOidc.sql'),
      updateSaml:sql('service_details_protocol/updateSaml.sql'),
      checkEntityId:sql('service_details_protocol/checkEntityId.sql'),
      addSaml:sql('service_details_protocol/addSaml.sql')
    },
    service:{
      getService:sql('service/getService.sql'),
      getPending:sql('service/getPending.sql')
    },
    user_info:{
      add:sql('user_info/add.sql')
    },
    service_petition_details:{
      add:sql('service_petition_details/add.sql'),
      update:sql('service_petition_details/update.sql'),
      belongsToRequester:sql('service_petition_details/belongsToRequester.sql')
    },
    service_state:{
      add:sql('service_state/add.sql'),
      update:sql('service_state/update.sql'),
    },
    user:{
      getReviewers:sql('user/getReviewers.sql'),
      getServiceOwners:sql('user/getServiceOwners.sql'),
      getPetitionOwners:sql('user/getPetitionOwners.sql'),
      getReviewEntitlements:sql('user/getReviewEntitlements.sql')
    },
    petition: {
      getPetition:sql('petition/getPetition.sql'),
      getOwnPetition:sql('petition/getOwnPetition.sql'),
      canReviewOwn:sql('petition/canReviewOwn.sql'),
      getOldOwnPetition:sql('petition/getOldOwnPetition.sql'),
      getOldPetition:sql('petition/getOldPetition.sql')
    },
    service_list: {
      getOwnList:sql('service_list/getOwnList.sql'),
      getAllList:sql('service_list/getAllList.sql')
    },
    group: {
      getGroupMembers:(sql('group/getGroupMembers.sql')),
      getGroupManagers:(sql('group/getGroupManagers.sql'))
    },
    invitations: {
      getAll:(sql('invitations/getAll.sql')),
      get:(sql('invitations/get.sql')),
      getOne:(sql('invitations/getOne.sql'))

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
