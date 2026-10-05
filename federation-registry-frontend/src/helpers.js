
function shallowEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (let key of keys1) {
      if (object1[key] !== object2[key]) {
        return false;
      }
    }
    return true;
  }

function formatDuration(maxSeconds) {
  const units = [
    { label: "year", seconds: 365 * 24 * 60 * 60 },
    { label: "month", seconds: 30 * 24 * 60 * 60 },
    { label: "day", seconds: 24 * 60 * 60 },
    { label: "hour", seconds: 60 * 60 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const unit of units) {
    const value = maxSeconds / unit.seconds;

    if (value >= 1) {
      const rounded = Math.round(value * 10) / 10;

      return `${rounded} ${unit.label}${rounded !== 1 ? "s" : ""} (${maxSeconds}s)`;
    }
  }

  return `${maxSeconds} s`;
}


function capitalWords(item) {
   var splitStr = item.toLowerCase().split(' ');
      for (var i = 0; i < splitStr.length; i++) {
          // You do not need to check if i is larger than splitStr length, as your for does that for you
          // Assign it back to the array
          splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
      }
      return splitStr.join(' ');
}

function calcDiff(old_state,new_state,config,diff){
    const deep_diff = diff(new_state,old_state);
    let changes = {}
    let multivalue_attributes = [];
    for (const service_property in old_state) old_state[service_property]&&typeof(old_state[service_property])==='object'&&multivalue_attributes.push(service_property); 
    for (const service_property in new_state) new_state[service_property]&&typeof(new_state[service_property])==='object'&&!multivalue_attributes.includes(service_property)&&multivalue_attributes.push(service_property);
    for(let i=0;i<deep_diff.length;i++){
    if(!multivalue_attributes.includes(deep_diff[i].path[0])){
        changes[deep_diff[i].path[0]]=deep_diff[i].kind;
        }
    }
    multivalue_attributes.forEach(attribute=>{
        changes[attribute] = {};
        if(new_state[attribute]||old_state[attribute])
            if(!new_state[attribute]){
            new_state[attribute]= [];
            }
            if(!old_state[attribute]){
            old_state[attribute] = [];
            }

            if((new_state[attribute]&&typeof(new_state[attribute][0])==='object')||(old_state[attribute]&&typeof(old_state[attribute][0])==='object')){
                if(attribute==='requested_attributes'){
                    changes.requested_attributes.N = new_state.requested_attributes.filter(x=> !old_state.requested_attributes.some(e=> e.friendly_name === x.friendly_name));
                    changes.requested_attributes.D = old_state.requested_attributes.filter(x=> !new_state.requested_attributes.some(e=> e.friendly_name === x.friendly_name));
                    changes.requested_attributes.U = new_state.requested_attributes.filter(x=> old_state.requested_attributes.some(e=> e.friendly_name === x.friendly_name&&(e.required!==x.required||e.name!==x.name)));
                }
                else{
                    changes[attribute].D = old_state[attribute].filter((x,index)=>{    
                        let match = false;
                        new_state[attribute].forEach(y=>{
                            if(shallowEqual(x,y)){
                                match = true
                            }
                        })
                        // If there was no match for the old state value we add it to the deleted values
                        return !match
                    });
                    changes[attribute].N = new_state[attribute].filter((x,index)=>{
                        let match = false;
                        old_state[attribute].forEach(y=>{
                        if(shallowEqual(x,y)){
                            match = true
                        }
                        })
                        // If there is no match for new state value we add it to the new values 
                        return !match
                    }); 
                }
            }

            if((typeof(new_state[attribute][0])==='string')||typeof(old_state[attribute][0])==='string'){
                changes[attribute].D = old_state[attribute].filter(x=>!new_state[attribute].includes(x));
                changes[attribute].N = new_state[attribute].filter(x=>!old_state[attribute].includes(x));   
            }
    })
    for(var property in config.extra_fields){        
        if(config.extra_fields[property].tag==='coc'){
            delete changes[property];
            if(old_state[property]!==new_state[property]&&!(old_state[property]==null&&new_state[property]===false)){
                changes[property] = 'N'; 
            }
        }
    }
    return changes;
}

function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

function urlReachabilityEnabled(config) {
    return config.check_url_reachability === true;
}

function createReadings() {
    let latest = 0;
    return {
        // Call before a request starts; what it answers is that request's token.
        start: function () {
            latest += 1;
            return latest;
        },
        isCurrent: function (token) {
            return token === latest;
        }
    };
}

const metadataFormFields = {
    entity_id: 'Entity id',
    requested_attributes: 'Requested attributes',
    service_name: 'Service name',
    service_description: 'Service description'
};

const attributeWarningCodes = ['no_attributes', 'unsupported_attributes'];

function isEmptyValue(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim() === '';
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return false;
}

function metadataProposal(metadata, values, options) {
    const opts = options || {};
    const current = values || {};
    const fill = [];
    const replace = [];
    Object.keys(metadataFormFields).forEach((field) => {
        const found = field === 'requested_attributes' ? metadata.supported_attributes : metadata[field];
        if (isEmptyValue(found)) {
            return;
        }
        // no field to write the list to when the tenant hides the table
        if (field === 'requested_attributes' && !opts.attributesEnabled) {
            return;
        }
        const held = current[field];
        if (isEmptyValue(held)) {
            fill.push({ field: field, label: metadataFormFields[field], value: found });
        }
        else if (!sameContents(found, held)) {
            replace.push({ field: field, label: metadataFormFields[field], value: found, held: held });
        }
    });
    return { fill: fill, replace: replace };
}

function applyProposal(values, entries) {
    const merged = Object.assign({}, values || {});
    (entries || []).forEach((entry) => {
        merged[entry.field] = copyValue(entry.value);
    });
    return merged;
}

function copyValue(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => (entry && typeof entry === 'object' ? Object.assign({}, entry) : entry));
    }
    return value;
}

function sameContents(one, other) {
    if (!Array.isArray(one) || !Array.isArray(other)) {
        return !Array.isArray(one) && !Array.isArray(other) && one === other;
    }
    if (one.length !== other.length) {
        return false;
    }
    const key = (entry) => JSON.stringify([entry.friendly_name, entry.name, entry.required, entry.name_format]);
    const left = one.map(key).sort();
    const right = other.map(key).sort();
    return left.every((entry, index) => entry === right[index]);
}

function metadataWarnings(warnings, attributesEnabled) {
    return (warnings || []).filter((warning) => attributesEnabled || !attributeWarningCodes.includes(warning.code));
}



module.exports = {
    capitalWords,removeA,calcDiff,formatDuration,urlReachabilityEnabled,createReadings,
    metadataProposal,metadataWarnings,metadataFormFields,applyProposal
}
