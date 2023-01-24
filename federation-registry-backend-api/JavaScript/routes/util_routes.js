var router = require('express').Router({ mergeParams: true });

var https = require('https');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var convert = require('xml-js');
var default_supported_attributes = require('../tenant_config/requested_attributes.json')


parser.on('error', function(err) { console.log('Parser error', err); });
router.get('/metadata_info',async (req,res,next)=>{
    try{
      let url = decodeURIComponent(req.query.metadata_url);
      var data = '';
      const request = https.get(url, function(response) {
        if (response.statusCode >= 200 && response.statusCode < 400) {
          response.on('data', function(data_) {
            data += data_.toString(); });
          response.on('end', function() {
            var result;
            if(data){
              try{
                result = convert.xml2js(data, {compact: true, spaces: 4});
                // res.status(200).send(result);
              }
              catch(err){             
                res.statusMessage = "Could not load XML from Metadata Url."
                res.status(404).send();
              }
            }
            else{
              res.statusMessage = "Could not load XML from Metadata Url."
              res.status(404).send();
            }
            try{
              if(result){
                let entity_id, requested_attributes; 
                let supported_attributes=[];
                let unsupported_attributes= [];
                let pretext = '';
                if(result['md:EntityDescriptor']){
                  pretext='md:'
                }
                try{                  
                  entity_id=result[pretext+'EntityDescriptor']['_attributes'].entityID;  
                }
                catch(err){};
                try{
                  requested_attributes = result[pretext+'EntityDescriptor'][pretext+'SPSSODescriptor'][pretext+'AttributeConsumingService'][pretext+'RequestedAttribute'];                 
                  if(requested_attributes){
                    requested_attributes.forEach((attribute,index)=>{
                      requested_attributes[index] = {
                        friendly_name:requested_attributes[index]._attributes.FriendlyName,
                        name:requested_attributes[index]._attributes.Name,
                        required:!!requested_attributes[index]._attributes.isRequired,
                        name_format:requested_attributes[index]._attributes.NameFormat
                      }
                    });
                    supported_attributes = requested_attributes.filter(e=> default_supported_attributes.some(x=>x.name===e.name));
                    unsupported_attributes = requested_attributes.filter(e=> default_supported_attributes.every(x=>x.name!==e.name));
                  }
                }
                catch(err){
                  if(entity_id){
                    res.status(200).send({entity_id,supported_attributes:[],unsupported_attributes:[],metadata_url:url});
                  }
                }
                if(entity_id||supported_attributes.length>0){
                  res.status(200).send({entity_id, supported_attributes:supported_attributes, unsupported_attributes:unsupported_attributes,metadata_url:url});
                }
                else{
                  res.statusMessage = "Could not load Service properties from Metadata Url."
                  res.status(404).send();
                }
              }  
            }
            catch(err){
              res.statusMessage = "Could not load Service properties from Metadata Url."
              res.status(404).send();
            }
          });
        }else{
          res.statusMessage = "Could not load XML from Metadata Url."
          res.status(404).send();
        }
      })

      request.on('error', (e) => {
        res.statusMessage = "Could not load XML from Metadata Url."
        res.status(404).send();
      });
    }
    catch(err){
      res.statusMessage = "Could not load XML from Metadata Url."
      res.status(404).send();
    }
  })




module.exports = router;