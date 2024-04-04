import React from 'react';
import { useTable ,useFilters,useSortBy,usePagination} from 'react-table';
import Pagination from 'react-bootstrap/Pagination';
import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';
// import Badge from 'react-bootstrap/Badge';
import LogoContainer from './LogoContainer.js';
// const {capitalWords} = require('./helpers.js');

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
            {page.length>0?page.map((row,row_index) => {
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
            }):
              <tr><td colSpan={4}><span className='service-overview-no-services'>No services to display...</span></td></tr>
            }
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

  export default ServiceTable