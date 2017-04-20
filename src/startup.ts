"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MssqlDriver_1 = require("./drivers/MssqlDriver");
const MysqlDriver_1 = require("./drivers/MysqlDriver");
const Engine = require("./Engine");
const Yargs = require("yargs");
const config = require("./database.json");
// var x = Mustache.render("{{a}}", { a: 'test' });
// console.log(x);
let driver = new MysqlDriver_1.MysqlDriver();
driver.ConnectToServer(
  config.databaseName,
  config.host,
  config.port,
  config.username,
  config.password
);
 let dbModel:any={};
 

let engine = new Engine.Engine(
    driver,{
        host: config.host,
        port: config.port,
        databaseName: config.databaseName,
        user: config.username,
        password: config.password
    });

console.log(`[${new Date().toLocaleTimeString()}] Starting creation of model classes.`);
engine.createModelFromDatabase().then( ()=>{
        // process.abort();
        console.info(`[${new Date().toLocaleTimeString()}] Typeorm model classes created.`)
})
