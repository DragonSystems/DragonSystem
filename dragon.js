#!/usr/bin/env node

var cmd = require('commander');
var figlet = require('figlet');
var chalk = require('chalk');
var inquirer = require('inquirer');
var shell = require('shelljs');
var path = require('path');
var os = require('os');

var homeDir = path.join(os.homedir(), ".dragon");
var environment = "Desktop"
var debug = false;
var site = "";
var socket = "";
var apiKey = "";
var dockerRegistry = "";

cmd.option('ps', 'Show running status')
  .option('run', 'Run dockers')
  .option('logs', 'Get docker logs')
  .option('stop', 'Stop all running dockers')
  .option('kill', 'Forcefully stop all running dockers')
  .option('rm', 'Clear all stopped docker containers')
  .version('0.1.0', '-v, --version', 'Output the version number')
  .parse(process.argv);

if (process.argv.length == 2) {
  figlet.text('    dragon system    ', {
    font: 'Ogre',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }, function(err, data) {
    if(err){
      console.log('Something went wrong...');
      console.dir(err);
      return;
    }
    console.log(chalk.bold.hex('#FF0033')(data));
    console.log(chalk.hex('#C8C420')('                                                                   v0.01'));
    installWhere();
  });
}

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
    name: 'apiKey',
    message: 'NS1 API key:'
  },
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
  shell.mkdir('-p', homeDir)
  shell.cd(homeDir);
  shell.cp(path.join(__dirname, "platform.env.example"), path.join(homeDir, "platform.env"));
  shell.cp(path.join(__dirname, "docker-compose.yaml"), path.join(homeDir, "docker-compose.yaml"));
  shell.ln('-sf', path.join(__dirname, "DragonCerts"), path.join(homeDir, "DragonCerts"))
  shell.ln('-sf', path.join(__dirname, "DragonChain"), path.join(homeDir, "DragonChain"))
  shell.ln('-sf', path.join(__dirname, "DragonProxy"), path.join(homeDir, "DragonProxy"))
  shell.ln('-sf', path.join(__dirname, "DragonSite"), path.join(homeDir, "DragonSite"))
  shell.ln('-sf', path.join(__dirname, "DragonSockets"), path.join(homeDir, "DragonSockets"))
  shell.ln('-sf', path.join(__dirname, "DragonStore"), path.join(homeDir, "DragonStore"))
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
    console.log("Starting up docker containers ... ");
    shell.exec('docker-compose up -d');
  } else {
    //console.log("Pulling docker images from " + dockerRegistry + " ... ");
    //shell.exec('docker-compose pull');
    console.log("Starting up docker containers ... ");
    shell.exec('docker-compose up -d');
  }
}

if (cmd.ps) {
  shell.cd(homeDir);
  shell.exec('docker-compose ps');
}

if (cmd.run) {
  shell.cd(homeDir);
  shell.exec('docker-compose up -d');
}

if (cmd.stop) {
  shell.cd(homeDir);
  shell.exec('docker-compose stop');
}

if (cmd.kill) {
  shell.cd(homeDir);
  shell.exec('docker-compose kill');
}

if (cmd.rm) {
  shell.cd(homeDir);
  shell.exec('docker-compose rm -f');
}

if (cmd.logs) {
  shell.cd(homeDir);
  shell.exec('docker-compose logs -f');
}
