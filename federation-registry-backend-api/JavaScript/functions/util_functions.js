function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
}

const getUserFromClaims = (user_claims,tenant) => {
    let user = user_claims
    user.sub = user_claims[tenant_config[tenant].claims.sub_claim];
    user.name = user_claims[tenant_config[tenant].claims.display_name_claim];
    user.family_name = user_claims[tenant_config[tenant].claims.family_name_claim];
    user.preferred_username = user_claims[tenant_config[tenant].claims.username_claim];
    user.email = user_claims[tenant_config[tenant].claims.email_claim];
    user.eduperson_entitlement = user_claims[tenant_config[tenant].claims.entitlements_claim]
    return user;
} 

module.exports = {
    arrayUnique,
    getUserFromClaims
}