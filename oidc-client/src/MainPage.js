import React from 'react';
import {BrowserRouter as Router,Link} from "react-router-dom";
import Nav from 'react-bootstrap/Nav';
import {Header,Footer} from './HeaderFooter.js'
import Routes from './Router';



export const MainPage = () => {

    return(
      <React.Fragment>
      <div className="main-container">

        <Header/>
        <Router>
          <div className="flex-container">
            <Nav defaultActiveKey="/home" className="flex-column nav-side">
              <div className="nav-title">PERSONAL</div>
              <Link to="/petitions">Manage Petitions</Link>
            </Nav>
            <Routes/>
          </div>
        </Router>
        <Footer/>
      </div>
      </React.Fragment>
    );

}

// eslint-disable-next-line
{/*

function Child(props) {
  // We can use the `useParams` hook here to access
  // the dynamic pieces of the URL.
  let { id } = useParams();


  return <FormTabs editConnection={props.connections[id]}/>
}
*/}
