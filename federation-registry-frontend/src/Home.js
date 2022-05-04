import React,{useEffect,useState,useContext} from 'react';
import { useTranslation } from 'react-i18next';
import {userContext,tenantContext} from './context.js';
import { useHistory,useParams } from "react-router-dom";
import {LoadingPage} from './Components/LoadingPage.js';
import config from './config.json';
import { useTable ,useFilters,useSortBy,usePagination} from 'react-table';
import Pagination from 'react-bootstrap/Pagination';
import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';
// import Badge from 'react-bootstrap/Badge';
import LogoContainer from './Components/LogoContainer.js';
// const {capitalWords} = require('./helpers.js');

const Home = ()=> {

  // eslint-disable-next-line
  let history = useHistory();
  let {tenant_name} = useParams();
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);
  // eslint-disable-next-line
  const [user, setUser] = useContext(userContext);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [loading,setLoading] = useState(false);
  const [services,setServices] = useState([]);

   useEffect(()=>{
    if(user&&user.name){
      let redirectUrl = localStorage.getItem('url');
      if(localStorage.getItem('invitation')){
        activateInvitation();
      }
      else if(redirectUrl){
        if(redirectUrl.split('/')[1]===tenant_name){
          localStorage.removeItem('url');
          history.push(redirectUrl);
        }
        else{
          localStorage.removeItem('url');
        }
      }
    }
     // eslint-disable-next-line
   },[user]);

   useEffect(()=>{
     getServices();
      // eslint-disable-next-line
    },[])

   const getServices = () => {
    fetch(config.host+'tenants/'+tenant_name+'/services?integration_environment=production', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'}
    }).then( response=>{
          if(response.status===200||response.status===200){return response.json();}
          else if(response.status!==200){return true}
          else {return false}
        }).then(response=>{
          setLoading(false);
          if(response){
            setServices(response);
          }
    })
   }

   const activateInvitation = () => {
     fetch(config.host+'tenants/'+tenant_name+'/invitations/activate_by_code', {
       method: 'PUT', // *GET, POST, PUT, DELETE, etc.
       credentials: 'include', // include, *same-origin, omit
       headers: {
       'Content-Type': 'application/json',
       'Authorization': localStorage.getItem('token')
       },
       body: JSON.stringify({code:localStorage.getItem('invitation')})
     }).then( response=>{
           if(response.status===406){return response.json();}
           else if(response.status!==200){return true}
           else {return false}
         }).then(response=>{
           setLoading(false);
           localStorage.removeItem('invitation');
           if(response){
             history.push('/'+tenant_name+'/invitation_error',{error: response.error});
           }
           else {
             history.push('/'+tenant_name+'/invitations');
           }
     })
   }


  return (
    <React.Fragment>
      {loading?<LoadingPage  loading={loading}/>:null}
      <div className="home-container">
        <h1>{t('main_greeting')}</h1>
        <p>{localStorage.getItem('invitation')?t('invitation_landing_page_message'):tenant.description}</p>
        
      </div>
      {services.length>0&&!user?<ServiceTable services={services}/>:null}
    </React.Fragment>
  )
}

const ServiceTable = ({services}) => {

  // Define a default UI for filtering
  function SearchFilter({
    column: { filterValue, preFilteredRows, setFilter },
  }) {
    const count = preFilteredRows.length

    return (
      <div className='home-search-input'>
        <FormControl
          type="text"
          value={filterValue || ''}
          onChange={e => {
            setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
          }}
          placeholder={`Search ${count} records...`}
        />
      </div>
    )
  }

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: SearchFilter,
    }),
    []
  )

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    []
  )


  const columns = React.useMemo(
    () => [
      {
        Header: 'Logo',
        accessor: 'logo_uri',
        disableSortBy: true,
        disableFilters: true,
        Cell: props => {
          return (
            <React.Fragment>
                            <div>
                              {/* <h5>
                                <Badge 
                                  className="status-badge"
                                  variant={props.row.original.integration_environment==='development'?'secondary':props.row.original.integration_environment==='demo'?'dark':props.row.original.integration_environment==='production'?'info':'warning'}
                                >
                                  {capitalWords(props.row.original.integration_environment==='development'?'dev':props.row.original.integration_environment==='production'?'prod':props.row.original.integration_environment)}
                                </Badge>
                              </h5> */}
                              <LogoContainer url={props.value}/>

                            </div>
            </React.Fragment>
          )
        }
      },
      {
        Header: 'Service Name',
        Filter: SearchFilter,
        accessor: 'service_name', // accessor is the "key" in the data
        Cell: props => {
          return (
            props.row.original.website_url?
            <span className="home-table-service-name"><a target="_blank" rel="noreferrer" href={props.row.original.website_url}>{props.value}</a></span>:
            <span className="home-table-service-name">{props.value}</span>
          )
        }
      },
      {
        Header: 'Service Description',
        accessor: 'service_description',
        disableFilters: true,
        disableSortBy: true,
        Cell: props => {
          return props.value === null||props.value === "" ? "(not available)" : props.value;
       }
      },
      { 
        Header: "Policies",
        accessor: 'policy_uri',
        disableFilters: true,
        disableSortBy: true,
        Cell: props => {
          return (
            <React.Fragment>
              {(props.value === null||props.value === "")&&(props.row.original.aup_uri === null||props.row.original.aup_uri === "")?
                <div style={{marginTop:"0.5rem"}}>
                  (not available)
                </div>
              :
                <React.Fragment>
                  <div style={{marginTop:"0.5rem"}}>
                    {props.value === null||props.value === "" ?
                      "Privacy Policy (not available)" 
                    : 
                      <a href={props.value} rel="noreferrer" target="_blank">Privacy Policy</a>
                    }
                  </div>
                  <div style={{marginTop:"0.5rem",marginBottom:"0.5rem"}}>
                    {props.row.original.aup_uri === null||props.row.original.aup_uri === "" ? 
                      "Acceptable Use Policy (not available)"
                    :
                      <a href={props.row.original.aup_uri} rel="noreferrer" target="_blank">Acceptable Use Policy</a>
                    }
                  </div>

                </React.Fragment>
              }
            </React.Fragment>
            );
       }
      }
    ],
    []
  )


  const data = React.useMemo(() => services, [services])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page, // Instead of using 'rows', we'll use page,
    // which has only the rows for the active page

    // The rest of these things are super handy, too ;)
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable({ 
    columns,
    data, 
    defaultColumn, // Be sure to pass the defaultColumn option
    filterTypes,
    initialState: { pageIndex: 0 } },
    useFilters,
    useSortBy,
    usePagination)

  return (
    <React.Fragment >
      <div {...getTableProps()}>
        {headerGroups.map(headerGroup=>{
          return(
            <div {...headerGroup.getHeaderGroupProps()}>
              {
                headerGroup.headers.map(column=>{
                  
                  return(
                    <div {...column.getHeaderProps()}>
                      <div>{column.canFilter ? column.render('Filter') : null}</div>
                    </div>
                  )
                })
              }
             </div>
          ) 
        })}
      </div>
   
      <Table striped bordered hover className="home-services-table" {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => ( 
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                >
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>           
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row,row_index) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell,index) => {
                    return (
                      <td
                        {...cell.getCellProps()}
                      >
                        {
                        cell.render('Cell')}
                      </td>
                    )
                })}
              </tr>
            )
          })}
        </tbody>
      </Table>
      <div className="pagination">
        <Pagination.First onClick={() => gotoPage(0)} disabled={!canPreviousPage}/>
        <Pagination.Prev onClick={() => previousPage()} disabled={!canPreviousPage}/>
        <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage}/>
        <Pagination.Last onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}/>
        <div className="pagination-text-container">
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
          | Go to page:{' '}
        </div>
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        {' '}
        <FormControl as="select" 
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
          className="home-pagination-select"
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </FormControl>
      </div>
    </React.Fragment>
  )
} 

export default Home;
