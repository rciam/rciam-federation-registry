export const CallbackPage = () => {
  // eslint-disable-next-line
  let {code} = useParams();
  const [loading,setLoading] = useState(true);
  const globalState = useGlobalState();

  useEffect(()=>{
    getToken(code);
    // eslint-disable-next-line
  },[]);

  const getToken = (code)=>{
    fetch(config.host+'tokens/'+code,{
      method:'GET',
      credentials:'include',
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if(response.status===200){
        return response.json();
      }
      else {
        return false
      }
    }).then(response=>{
      if(response){

        localStorage.setItem('token','Bearer '+response.token);
        globalState.setLogState({
          tenant:'EGI',
          log_state:true
        });
        setLoading(false);
      }
    });
  }
  return (
    <React.Fragment>
      <LoadingPage loading={loading}/>
    </React.Fragment>
  )
}
