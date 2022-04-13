import React,{useState} from 'react';

const LogoContainer = (props) => {
    let [imageLoaded,setImageLoaded] = useState(false);
    return (
      <React.Fragment>
          {!imageLoaded?
            <div className={'logo-loader-container img-thumbnail ' + (props.small?'service-logo-small':'')}>
              <div  style={{ backgroundColor: '#C8C8C8' , height:'100%',alignItems:'center',display:'flex',justifyContent: 'center' }}>
                <div class="logo-loader"></div>
              </div>
            </div>
          :null}
          <img referrerPolicy="no-referrer" alt="" src={props.url?props.url:process.env.PUBLIC_URL + '/placeholder.png'}
          className={"home-service-logo img-thumbnail "+(!imageLoaded?"service-hide-logo ":" ") + (props.small?'service-logo-small':'')}                  
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            
            currentTarget.src=process.env.PUBLIC_URL + '/placeholder_not_found.png';
          }}
          onLoad={()=>{
            setImageLoaded(true);
          }}
          />
        
  
      </React.Fragment>
    )
  
  } 


export default LogoContainer;