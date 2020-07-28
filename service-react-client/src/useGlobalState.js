import React,{createContext,useReducer,useContext} from 'react';

const SET_LOG_STATE = 'SET_LOG_STATE';

const GlobalStateContext = createContext();

const initialState = {
  global_state: {
    log_state:false,
    tenant:null
  },
};

const globalStateReducer = (state,action) => {
  switch (action.type) {
    case SET_LOG_STATE:
      return {
        ...state,
        global_state: {...action.payload},
      };
      default:
        return state
  }
};

export const GlobalStateProvider = ({children}) => {
  const [state,dispach] = useReducer(globalStateReducer,initialState);

  return (
    <GlobalStateContext.Provider value={[state,dispach]}>
      {children}
    </GlobalStateContext.Provider>
  );
};
const useGlobalState = () => {
  const [state,dispatch] = useContext(GlobalStateContext);
  const setLogState = ({log_state,tenant})=> {
    dispatch({
      type: SET_LOG_STATE,
      payload: {
        log_state,
        tenant
      }
    });
  }
  return {
    setLogState,
    global_state: {...state.global_state},
  };
};

export default useGlobalState
