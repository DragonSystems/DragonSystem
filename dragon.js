#!/usr/bin/env node
var program = require('commander');
var figlet = require('figlet');
var chalk = require('chalk');
var inquirer = require('inquirer');
var shell = require('shelljs');

var environment = "Desktop"
var debug = false;
var site = "";
var socket = "";
var apiKey = "";
var dockerRegistry = "";

//figlet.text('    dragon system    ', {
//  font: 'Ogre',
//  horizontalLayout: 'default',
//  verticalLayout: 'default'
//}, function(err, data) {
//  if(err){
//    console.log('Something went wrong...');
//    console.dir(err);
//    return;
//  }
//  console.log(chalk.bold.hex('#FF0033')(data));
//  console.log(chalk.hex('#C8C420')('                                                                   v0.01'));
  installWhere();
//});

function installWhere(){
    inquirer.prompt([
        {
            type: 'list',
            message: 'Where are you installing the Dragon System?',
            name: 'environment',
            choices: [
            {
                name: 'Server'
            },
            {
                name: 'Desktop'
            }
            ]
        }
        ]).then(function (answers) {
            environment = answers.environment;
            if(environment == 'Desktop'){
                installDesktop();
            } else {
                //inquirer.prompt([
                //{
                //  type: 'input',
                //  name: 'registry',
                //  message: 'Docker registry :',
                //  default: function () {
                //    return 'local';
                //  }
                //}]).then(function (answers) {
                //  dockerRegistry = answers.registry;
                //});
                installServer();
            }
        });
}

function installDesktop() {
  getUserInputs();
}

function installServer() {
  getUserInputs();
}

function getUserInputs() {
  inquirer.prompt([
  {
    type: 'input',
    name: 'siteHostname',
    message: 'Site domain name:'
  },
  {
    type: 'input',
    name: 'socketHostname',
    message: 'Socket domain name:'
  },
  {
    type: 'input',
    name: 'apiKey',
    message: 'NS1 API key:'
  },
  {
    type: 'list',
    message: 'Debug mode enabled or disabled?',
    name: 'debug',
    choices: [
      {
          name: 'Enable'
      },
      {
          name: 'Disable'
      }
    ]
  }
  ]).then(function (answers) {
    validateUserInputs(answers);
  });
}

function validateUserInputs(answers) {

  site = answers.siteHostname;
  socket = answers.socketHostname;
  apiKey = answers.apiKey;
  debug = answers.debug;

  console.log("===========================================");
  console.log("Site: " + site);
  console.log("socket: " + socket);
  console.log("API Key: " + apiKey);
  if(debug == 'Enable'){
    debug = true;
    console.log("Debug mode: " + debug);
  }
  console.log("===========================================");
  inquirer.prompt([
  {
    type: 'list',
    message: 'Continue on installation?',
    name: 'install',
    choices: [
      {
          name: 'No'
      },
      {
          name: 'Yes'
      }
    ]
  }
  ]).then(function (answers) {
    if(answers.install == 'Yes'){
      console.log("Starting install ...");
      updatePlatformEnv();
    } else {
      process.exit(0);
    }
  });
}

function updatePlatformEnv() {
  console.log("Updating configurations ... ");
  if(debug == "false"){
    shell.sed('-i', 'DEBUG=.*', "#DEBUG=1", 'platform.env');
  }
  shell.sed('-i', 'SITE_HOSTNAME=.*', "SITE_HOSTNAME=" + site, 'platform.env');
  shell.sed('-i', 'SOCKET_HOSTNAME=.*', "SOCKET_HOSTNAME=" + socket, 'platform.env');
  shell.sed('-i', 'SSL_API_KEY=.*', "SSL_API_KEY=" + apiKey, 'platform.env');
  runCompose();
}

function runCompose(build){

  if(environment == "Desktop"){
    console.log("Building docker images ... ");
    shell.exec('docker-compose build');
//  shell.exec('docker-compose build', function(code, stdout, stderr) {
//   // console.log('Exit code:', code);
//   // console.log('Program output:', stdout);
//   // console.log('Program stderr:', stderr);
//  })
    console.log("Starting up docker containers ... ");
    shell.exec('docker-compose up -d');
  } else {
    console.log("Pulling docker images from " + dockerRegistry + " ... ");
    shell.exec('docker-compose pull');
    console.log("Starting up docker containers ... ");
    shell.exec('docker-compose up -d --no-build');
  }
}
