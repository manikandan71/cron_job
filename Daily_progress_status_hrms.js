const sql = require('mssql/msnodesqlv8');
const cron = require('node-cron');
const nodemailer = require("nodemailer");
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { json } = require('body-parser');
const { start } = require('repl');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
app.use(bodyParser.json());
app.use(express.json());

// sql server connection

var config={
  database: 'hrms_qa',
  server: 'database-1.cnxf3dmfgngv.us-east-1.rds.amazonaws.com',
  user: "admin",
  password: "VLGrQ5z5EkkQcBhH",
}

// scheduling the Job
// cron.schedule( "0 23 * * *")
cron.schedule("*/10 * * * * *", function(){
  console.log("Hello world");
  startTesting();
})

function startTesting(){

      sql.connect(config, function(err){
        if(err){
          console.log(err);
        }

        var request = new sql.Request();
        var project ;

        // FETCHING  PROJECT ID , TOTAL HOURS FROM PROJECTEMPLOYEE MAPPING

        request.query('select  p.project_id, sum(p.estimated_hours) as total from hrms_qa.dbo.ProjectEmployee_Mapping as p group by p.project_id;', function(err, recordSet){
          if(err){
            console.log(err);
          }
            
          var read = JSON.stringify(recordSet);
            project = JSON.parse(read);
    
          // FETCHING THE PROJECT NAME , PLANNED HOURS FROM PROJECT MASTER TABLE

        request.query('SELECT pm.id, pm.project_name, pm.plannedhours FROM hrms_qa.dbo.project_master as pm;', function(err, recordSet){
          if(err){
            console.log(err);
          }
            
          var read = JSON.stringify(recordSet);
          var json = JSON.parse(read);
      
        // FETCHING NAME, EMAIL, PROJECTID FROM EMPLOYEE MAPPING AND EMPLOYEE MASTER

      request.query('select distinct p.project_id , em.firstname as Name , em.email_id  from  hrms_qa.dbo.ProjectEmployee_Mapping as p , hrms_qa.dbo.employee_master as em where p.project_manager = em.id order by p.project_id;', function(err, recordSet){
        if(err){
          console.log(err);
        }
          
        var read = JSON.stringify(recordSet);
        var manager_id = JSON.parse(read);
        
        // CHECKING THE TOTAL HOURS EXCEED THE PLANNED HOURS IF ITS EXCEDD MEANS IT WILL SENT EMAIL TO ADMIN.

         for(var i=0; i<project.recordset.length;i++){
          for(var j=0; j<json.recordset.length;j++){
  
            if(project.recordset[i].project_id == json.recordset[j].id){
              
              if( project.recordset[i].total> json.recordset[i].plannedhours)
              {
                
                for( var k = 0; k<manager_id.recordset.length;k++){
                  if( project.recordset[i].project_id == manager_id.recordset[k].project_id){

                    console.log("planned hours got exceed " + json.recordset[i].project_name + " "+manager_id.recordset[k].Name);
                   
                    var record = JSON.stringify({
                                  "record_name" : json.recordset[i].project_name,
                                  "name" :  manager_id.recordset[k].Name,
                                  "planned_hrs":  json.recordset[i].plannedhours ,
                                  "total_hrs": project.recordset[i].total,
                                  // "email_id" : manager_id.recordset[k].email_id,
                                  "manager":"manikandan.m@ittstar.com",
                                  "sales_executive" : "manikandan.m@ittstar.com",
                                  "delivery_head": "manikandan.m@ittstar.com"
                    });
                    //  console.log(record);
                    sentMail( record);
                    
                  }
                }    

              }
              else{
                // console.log("total" + project.recordset[i].total);
                // console.log("planned hours" + json.recordset[i].plannedhours);
                console.log("not exceed " + json.recordset[i].project_name );
              }
              
            }
  
          }
        }    
        
      });
      
    });
  }); 
});
}


function sentMail(record){

 console.log(record);
  var objectValue = JSON.parse(record);
 var manager = [objectValue.manager, 1];
 var delivery_head = [objectValue.delivery_head,2];
 var sales_Executive = [objectValue.sales_executive, 3];
 
      if (manager[1] == 1){
       
        const transporter = nodemailer.createTransport({
          host: "smtp.office365.com",
          port:'587',
            
            secureConnection: false,
            tls: {
              ciphers: 'SSLv3'                            // tls version
             },
            auth : {
              user:"hrms@ittstar.com",
              pass: "Tar83111"
            }
          });

            const handlebarOptions ={ 
              viewEngine:{
                extName:".handlebars",
                partialsDir:path.resolve('./views'),
                defaultLayout: false,
              },
              viewPath:path.resolve('./views'),
              extName:".handlebars",

            }         
          transporter.use('compile', hbs(handlebarOptions));
      
      const options = {
          from: "hrms@ittstar.com",
          to: manager[0],
          subject:"project alert",
          text: "Hi manager, this the project alert testing" ,
          template:'admin',
          context:{
             project_name: objectValue.record_name,
             des : "project limit got exceed",
             cost : "$ 1000",
             planned_hours:objectValue.planned_hrs + " hrs",
             total_hours: objectValue.total_hrs + " hrs",
             manager_name: objectValue.name ,
             email_id: manager[0]
          }
      };
      
      transporter.sendMail(options,  function(err,info){
              if(err){
                  console.log(err);
                  return;
              }
              console.log("sent"+info.response);
      });
      }

      
      if (delivery_head[1] == 2){
       
        const transporter = nodemailer.createTransport({
          host: "smtp.office365.com",
          port:'587',
            
            secureConnection: false,
            tls: {
              ciphers: 'SSLv3'                            // tls version
             },
            auth : {
              user:"hrms@ittstar.com",
              pass: "Tar83111"
            }
          });

            const handlebarOptions ={ 
              viewEngine:{
                extName:".handlebars",
                partialsDir:path.resolve('./views'),
                defaultLayout: false,
              },
              viewPath:path.resolve('./views'),
              extName:".handlebars",

            }         
          transporter.use('compile', hbs(handlebarOptions));
      
      const options = {
          from: "hrms@ittstar.com",
          to: delivery_head[0],
          subject:"project alert",
          text: "Hi manager, this the project alert testing" ,
          template:'admin',
          context:{
             project_name: objectValue.record_name,
             des : "project limit got exceed",
             cost : "$ 1000",
             planned_hours:objectValue.planned_hrs + " hrs",
             total_hours: objectValue.total_hrs + " hrs",
             manager_name: objectValue.name ,
             email_id: delivery_head[0]
          }
      };
      
      transporter.sendMail(options,  function(err,info){
              if(err){
                  console.log(err);
                  return;
              }
              console.log("sent"+info.response);
      });
      }

      
      if (sales_Executive[1] == 3){
       
        const transporter = nodemailer.createTransport({
          host: "smtp.office365.com",
          port:'587',
            
            secureConnection: false,
            tls: {
              ciphers: 'SSLv3'                            // tls version
             },
            auth : {
              user:"hrms@ittstar.com",
              pass: "Tar83111"
            }
          });

            const handlebarOptions ={ 
              viewEngine:{
                extName:".handlebars",
                partialsDir:path.resolve('./views'),
                defaultLayout: false,
              },
              viewPath:path.resolve('./views'),
              extName:".handlebars",

            }         
          transporter.use('compile', hbs(handlebarOptions));
      
      const options = {
          from: "hrms@ittstar.com",
          to: sales_Executive[0],
          subject:"project alert",
          text: "Hi manager, this the project alert testing" ,
          template:'admin',
          context:{
             project_name: objectValue.record_name,
             des : "project limit got exceed",
             cost : "$ 1000",
             planned_hours:objectValue.planned_hrs + " hrs",
             total_hours: objectValue.total_hrs + " hrs",
             manager_name: objectValue.name ,
             email_id: sales_Executive[0]
          }
      };
      
      transporter.sendMail(options,  function(err,info){
              if(err){
                  console.log(err);
                  return;
              }
              console.log("sent"+info.response);
      });
      }
      
}

app.listen(8081, ()=> console.log('Listening on port 8081...'));