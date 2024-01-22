import React, { useEffect, useMemo, useState } from 'react'
import { useTable,usePagination } from 'react-table'
import { COLUMNS } from './columns'
import axios from 'axios'
import './table.css'
import FilterImg from '../assets/filter.svg'
import {read,utils,writeFile} from 'xlsx'
export const BasicTable = () => {
  const [contacts, setContacts] = useState([])
  const [sortType, setSortType] = useState('')
 

  useEffect(() => {
    fetchData()
  }, [sortType])

  const fetchData = async () => {
    try {
      let response = await axios.post('http://localhost:5000/v1/all-contacts',{
        sorting: sortType,
      }) 
      setContacts(response.data.msg)
    } catch (error) {
      console.log(error)
    }
  }
  const columns = useMemo(() => COLUMNS, [])
  const data = contacts

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    canNextPage,
    canPreviousPage,
    nextPage,
    pageOptions,
    previousPage,
    setPageSize,
    state,
    prepareRow,
  } = useTable({
    columns,
    data,
  },usePagination)

  const{pageSize,pageIndex}=state



  const [selectedRows, setSelectedRows] = useState([]);
  const [dowContacts, setDowContacts] = useState([]);

  const handleRowClick = (rowId) => {
    // Toggle the selected state of the row
    if (selectedRows.includes(rowId)) {
      setSelectedRows(selectedRows.filter((id) => id !== rowId));
    } else {
      setSelectedRows([...selectedRows, rowId]);
    }
    setDowContacts(contacts.filter((obj) => !selectedRows.includes(obj.id)));
  };

  const handleDownloadCSV = async (type) => {
    try {
      // Send selectedRows to the server for CSV download
      const headings=[["Registration No.","Name","Phone","Email","Id","Designation","Fine"]]
      const wb=utils.book_new()
      const ws=utils.json_to_sheet([])
      utils.sheet_add_aoa(ws,headings)
      utils.sheet_add_json(ws,contacts,{origin:"A2",skipHeader:true})
      utils.book_append_sheet(wb,ws,"report")
      writeFile(wb,`Report.${type}`)
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };


  return (
    <div className='table_container'>
      <table {...getTableProps()} >
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render('Header')}{<img key={column.id} src={FilterImg} alt='filter image' className='filter_image' onClick={()=>{setSortType(column.id),console.log(column.id)}}/>}</th>
                // column.id
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}
              onClick={() => handleRowClick(row.id)}
              style={{ background: selectedRows.includes(row.id) ? 'lightblue' : 'white', cursor: 'pointer' }}
              >
                {row.cells.map((cell) => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
       
      </table>
      <div className='footer_sec'>
        PageSize: <select value={pageSize} onChange={(e)=>setPageSize(e.target.value)}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <span>Page{' '} <strong>{pageIndex+1} of {pageOptions.length}</strong></span>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <button onClick={()=>previousPage()} disabled={!canPreviousPage}>Prev</button>
        &nbsp;&nbsp;
        <button onClick={()=>nextPage()} disabled={!canNextPage}>Next</button>
      </div>
      <div>
        <button onClick={()=>handleDownloadCSV("csv")}>Download CSV</button>
        <button onClick={()=>handleDownloadCSV("xlsx")}>Download Excel</button>
        {/* <button onClick={}>Download XLSX</button> */}
      </div>
    </div>
  )
}
