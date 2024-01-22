const express = require('express');
const contactroute = express();
const cors=require('cors')
const multer=require('multer')
const Contact=require('../Database/models/contactModel')
const csv=require('csvtojson');
const excelTOJson=require('convert-excel-to-json');
const path=require('path');
const json2csv = require('json2csv').parse;
const ExcelJS = require('exceljs');
contactroute.use(express.json());
contactroute.use(cors());
contactroute.use(express.static(path.resolve(__dirname,'public')))

var storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/uploads')
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname)
    }
})

var upload=multer({storage:storage})
const importContactcsv =async(req,res)=>{
    try {
        csv().fromFile(req.file.path).then(async(resp)=>{
            console.log(resp)
            try {
                await Contact.insertMany(resp)
                res.send({status:200,success:true,msg:resp})
            } catch (error) {
                res.send({status:400,success:false,msg:error.message})
            }
        })
    } catch (error) {
        res.send({status:400,success:false,msg:error.message})
    }
}

const importContactxlsx =async(req,res)=>{
    try {
        
        if(req.file?.filename==null || req.file?.filename=='undefined'){
            res.send({status:400,success:false,msg:"error.message"})
        }else{
            var filePath=req.file.path;
            const excelData=excelTOJson({
                sourceFile:filePath,
                header:{
                    rows:1
                },
                columnToKey:{
                    "*":"{{columnHeader}}"
                }
            });
            try {
                await Contact.insertMany(excelData.hello)
                res.send({status:200,success:true,msg:excelData.hello})
            } catch (error) {
                res.send({status:400,success:false,msg:error.message})
            }

        }
    } catch (error) {
        res.send({status:400,success:false,msg:error.message})
    }
}

contactroute.post('/contacts',upload.single('file'),importContactcsv)
contactroute.post('/contactsxlsx',upload.single('file'),importContactxlsx)

contactroute.post('/all-contacts',async(req,res)=>{
    var result=await Contact.find({}).sort(`${req.body.sorting} : 1`);
    res.status(200).json({msg:result})
})

contactroute.post('/download-csv', async (req, res) => {
    try {
      const selectedRows = req.body.selectedRows; // Assuming the frontend sends an array of selected row IDs
  
      // Fetch selected contacts from MongoDB based on IDs
      const selectedContacts = await Contact.find({ id: { $in: selectedRows } });
  
      // Convert selected contacts to CSV format
      const csvData = json2csv(selectedContacts);
  
      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=selected-contacts.csv');
      res.status(200).send(csvData);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Endpoint to get and download selected rows as XLSX
  contactroute.post('/download-xlsx', async (req, res) => {
    try {
      const selectedRowIds = req.body.selectedRows;
  
      // Fetch selected contacts from MongoDB based on IDs
      const selectedContacts = await Contact.find({ id: { $in: selectedRowIds } });
  
      // Create a new Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Selected Contacts');
  
      // Add headers to the worksheet
      const headerRow = Object.keys(selectedContacts[0]);
      worksheet.addRow(headerRow);
  
      // Add data to the worksheet
      selectedContacts.forEach((contact) => {
        const row = Object.values(contact);
        worksheet.addRow(row);
      });
  
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=selected-contacts.xlsx');
      
      // Write the workbook to the response
      await workbook.xlsx.write(res);
      
      res.status(200).end();
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
module.exports=contactroute