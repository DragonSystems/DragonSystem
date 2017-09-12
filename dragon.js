#!/usr/bin/env node

var cmd = require('commander');
var figlet = require('figlet');
var chalk = require('chalk');
var inquirer = require('inquirer');
var shell = require('shelljs');
var validator = require('validator');
var path = require('path');
var os = require('os');
var sleep = require('system-sleep');
var ProgressBar = require('progress');
var logger = require('winston');
var properties = require ("properties");

shell.config.silent = true;
var homeDir = path.join(os.homedir(), ".dragon");
var debug = "Enable";
var site = "www.example.com";
var socket = "socket.example.com";
var apiKey = "12345678901234567890";
var dockerRegistry = "docker.io/kiyotocrypto";
var siteVersion = "latest"
var socketVersion = "latest"
var storeVersion = "latest"
var certsVersion = "latest"
var proxyVersion = "latest"
var logfile = path.join(homeDir, "dragon.log");
var confFile = path.join(homeDir, ".env");
var platformFile = path.join(homeDir, "platform.env");

shell.mkdir('-p', homeDir);

logger.add(logger.transports.File, {filename: logfile});
logger.remove(logger.transports.Console);

cmd.option('ps', 'Show running status')
  .option('init', 'initialize configurations')
  .option('start', 'Start dragon system in desktop mode')
  .option('desktop', 'Run dragon system in a desktop')
  .option('server', 'Run dragon system in a server')
  .option('build', 'Build dockers')
  .option('logs [name]', 'Get docker logs',  /^(site|socket|store|proxy|certs|parity)$/i)
  .option('stop', 'Stop all running dockers')
  .option('kill', 'Forcefully stop all running dockers')
  .option('rm', 'Clear all stopped docker containers')
  .option('push', 'Push build docker images to a docker registry')
  .option('pull', 'Pull builded docker images from a docker registry')
  .version('0.1.0', '-v, --version', 'Output the version number')
  .parse(process.argv);

var getInterface = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      figlet.text('    dragon system    ', {
        font: 'Ogre',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      }, function(err, data) {
        if(err){
          console.log('Error', err);
          logger.log('Error', err);
          return;
        }
        console.log(chalk.bold.hex('#FF0033')(data));
        console.log(chalk.hex('#C8C420')('                                                                   v0.01'));
      });
    resolve({data:'200'});
    }, 200);
  });
  return promise;
}

var validateDocker= function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      shell.exec('docker -v', function(code, stdout, stderr) {
        if (code !== 0) {
          logger.log('Error', "docker command not found,\nmsg: " + code + ", " + stderr);
          console.log('Error', "docker command not found,\nmsg: " + code + ", " + stderr);
          console.log("Use this guide to " + chalk.bold("install docker") +
            " in the system:\n\t" + chalk.italic("https://docs.docker.com/engine/installation/"));
          console.log("And this guide to install " + chalk.bold("docker-compose") +
            " in the system:\n\t" + chalk.italic("https://docs.docker.com/compose/install/"));
          process.exit(0);
        } else {
          shell.exec('docker-compose -v', function(code, stdout, stderr) {
            if (code !== 0) {
              logger.log('Error', "docker-compose command not found,\nmsg: " + code + ", " + stderr);
              console.log('Error', "docker-compose command not found,\nmsg: " + code + ", " + stderr);
              console.log("Use this guide to install " + chalk.bold("docker-compose") +
                " in the system:\n\t" + chalk.italic("https://docs.docker.com/compose/install/"));
              process.exit(0);
            }
          });
        }
      });
    resolve({data:'200'});
    }, 200);
  });
  return promise;
}

var loadEnv = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      if (shell.test('-f', confFile)) {
        properties.parse(confFile, {path: true}, function (error, data){
          dockerRegistry = data.DOCKER_REGISTRY_BASE;
          siteVersion = data.SITE_VERSION;
          storeVersion = data.STORE_VERSION;
          certsVersion = data.CERTS_VERSION;
          proxyVersion = data.PROXY_VERSION;
          socketVersion = data.SOCKET_VERSION;
        });
      }
    resolve({data:'200'});
    }, 200);
  });
  return promise;
}

var loadPlatform = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      if (shell.test('-f', platformFile)) {
        properties.parse(platformFile, {path: true}, function (error, data){
          debug = data.DEBUG;
          apiKey = data.SSL_API_KEY;
          site = data.SITE_HOSTNAME;
          socket = data.SOCKET_HOSTNAME;
        });
      }
    resolve({data:'200'});
    }, 200);
  });
  return promise;
}

var getUserInputs = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      inquirer.prompt([
      {
        type: 'input',
        name: 'siteHostname',
        message: 'Site domain name:',
        default: site,
        validate: function(str) {
          if (validator.isFQDN(str)) {
            return true;
          }
          return "Please enter a fully qualified domain name."
        }
      },
      {
        type: 'input',
        name: 'socketHostname',
        message: 'Socket domain name:',
        default: socket,
        validate: function(str) {
          if (validator.isFQDN(str)) {
            return true;
          }
          return "Please enter a fully qualified domain name."
        }
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'NS1 API key:',
        default: apiKey,
        validate: function(str) {
          if (validator.isByteLength(str, 20, 20)) {
            return true;
          }
          return "Please check the API key again ... "
        }
      },
      {
        type: 'input',
        name: 'dockerRegistry',
        message: 'Docker registry :',
        default: dockerRegistry
      },
      {
        type: 'input',
        name: 'siteVersion',
        message: 'dragon-site version: ',
        default: siteVersion
      },
      {
        type: 'input',
        name: 'socketVersion',
        message: 'dragon-socket version: ',
        default: socketVersion
      },
      {
        type: 'input',
        name: 'storeVersion',
        message: 'dragon-store version: ',
        default: storeVersion
      },
      {
        type: 'input',
        name: 'certsVersion',
        message: 'dragon-certs version: ',
        default: certsVersion
      },
      {
        type: 'input',
        name: 'proxyVersion',
        message: 'dragon-proxy version: ',
        default: proxyVersion
      },
      {
        type: 'list',
        message: 'Debug mode enabled or disabled?',
        name: 'debug',
        default: debug,
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
      //
    resolve({data:'200'});
    }, 200);
  });
  return promise;
}

function validateUserInputs(answers) {

  site = answers.siteHostname;
  socket = answers.socketHostname;
  apiKey = answers.apiKey;
  debug = answers.debug;

  dockerRegistry = answers.dockerRegistry;
  siteVersion = answers.siteVersion;
  storeVersion = answers.storeVersion;
  certsVersion = answers.certsVersion;
  proxyVersion = answers.proxyVersion;
  socketVersion = answers.socketVersion;

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
      //console.log("Starting install ...");
      logger.log("info", "Starting install");
      updateConfigFiles();
    } else {
      process.exit(0);
    }
  });
}

function updateConfigFiles(){
  //console.log("Updating configurations ... ");
  logger.log("info", "Updating configurations");
  shell.cd(homeDir);
  shell.cp(path.join(__dirname, "platform.env.example"), path.join(homeDir, "platform.env"));
  shell.cp(path.join(__dirname, ".env"), path.join(homeDir, ".env"));
  shell.cp(path.join(__dirname, "docker-compose.yaml"), path.join(homeDir, "docker-compose.yaml"));
  shell.ln('-sf', path.join(__dirname, "DragonCerts"), path.join(homeDir, "DragonCerts"));
  shell.ln('-sf', path.join(__dirname, "DragonChain"), path.join(homeDir, "DragonChain"));
  shell.ln('-sf', path.join(__dirname, "DragonProxy"), path.join(homeDir, "DragonProxy"));
  shell.ln('-sf', path.join(__dirname, "DragonSite"), path.join(homeDir, "DragonSite"));
  shell.ln('-sf', path.join(__dirname, "DragonSockets"), path.join(homeDir, "DragonSockets"));
  shell.ln('-sf', path.join(__dirname, "DragonStore"), path.join(homeDir, "DragonStore"));
  shell.sed('-i', 'DEBUG=.*', "DEBUG=" + debug, 'platform.env');
  shell.sed('-i', 'SITE_HOSTNAME=.*', "SITE_HOSTNAME=" + site, 'platform.env');
  shell.sed('-i', 'SOCKET_HOSTNAME=.*', "SOCKET_HOSTNAME=" + socket, 'platform.env');
  shell.sed('-i', 'SSL_API_KEY=.*', "SSL_API_KEY=" + apiKey, 'platform.env');
  shell.sed('-i', 'DOCKER_REGISTRY_BASE=.*', "DOCKER_REGISTRY_BASE=" + dockerRegistry, '.env');
  shell.sed('-i', 'SITE_VERSION=.*', "SITE_VERSION=" + siteVersion, '.env');
  shell.sed('-i', 'STORE_VERSION=.*', "STORE_VERSION=" + storeVersion, '.env');
  shell.sed('-i', 'CERTS_VERSION=.*', "CERTS_VERSION=" + certsVersion, '.env');
  shell.sed('-i', 'PROXY_VERSION=.*', "PROXY_VERSION=" + proxyVersion, '.env');
  shell.sed('-i', 'SOCKET_VERSION=.*', "SOCKET_VERSION=" + socketVersion, '.env');
}

function composeBuild(){
  console.log("Building docker images ... ");
  logger.log("info", "Bilding docker images");
  shell.exec('docker-compose build', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose build\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    }
  });
}

function composeUp(){
  console.log("Starting up docker containers ... ");
  logger.log("info", "Starting up docker containers");
  shell.exec('docker-compose up -d --no-build', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose up -d --no-build\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    }
  });
}

function composeBuildAndRun(){
  console.log("Building docker images ... ");
  logger.log("info", "Bilding docker images");
  shell.exec('docker-compose build', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose build\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    } else {
      console.log("Starting up docker containers ... ");
      logger.log("info", "Starting up docker containers");
      shell.exec('docker-compose up -d --no-build', function(code, stdout, stderr) {
        console.log(stdout);
        logger.log("info", "docker-compose up -d --no-build\n" + stdout);
        if (code !== 0) {
          logger.log('Error', "Code: " + code + ", msg: " + stderr);
          console.log('Error', "Code: " + code + ", msg: " + stderr);
        } else {
          console.log(chalk.blue("Update /etc/hosts entries to verify the setup."));
          console.log(chalk.underline.bgMagenta(chalk.white("$ sudo vim /etc/hosts")));
          console.log(chalk.blue("Add following lines to the file"));
          console.log(chalk.underline.bgBlue(chalk.white("127.0.0.1 " + site)));
          console.log(chalk.underline.bgBlue(chalk.white("127.0.0.1 " + socket)));
          console.log(chalk.blue("Save and exit using \'<Esc> :wq\'"));
        }
      });
    }
  });
}

function composePull(){
  console.log("Pulling docker images ... ");
  logger.log("info", "Pulling docker images");
  shell.exec('docker-compose pull', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose pull\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    }
  });
}

function composePullAndRun(){
  console.log("Pulling docker images ... ");
  logger.log("info", "Pulling docker images");
  shell.exec('docker-compose pull', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose pull\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    } else {
      console.log("Starting up docker containers ... ");
      logger.log("info", "Starting up docker containers");
      shell.exec('docker-compose up -d --no-build', function(code, stdout, stderr) {
        console.log(stdout);
        logger.log("info", "docker-compose up -d --no-build\n" + stdout);
        if (code !== 0) {
          logger.log('Error', "Code: " + code + ", msg: " + stderr);
          console.log('Error', "Code: " + code + ", msg: " + stderr);
        } else {
          console.log(chalk.blue("Update DNS to point " + site + " and " + socket + " to this server."));
        }
      });
    }
  });
}

function composePush(){
  console.log("Pushing images to docker registry ... ");
  logger.log("info", "Pushing images to docker registry");
  shell.exec("docker-compose push", function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose push\n" + stdout);
    if (code !== 0) {
          logger.log('Error', "Code: " + code + ", msg: " + stderr);
          console.log('Error', "Code: " + code + ", msg: " + stderr);
      }
  });
}

function composePs(){
  shell.exec('docker-compose ps', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose ps\n " + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    }
  });
}

function composeStop(){
  shell.exec('docker-compose stop', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose stop\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    }
  });
}

function composeKill(){
  shell.exec('docker-compose kill', function(code, stdout, stderr) {
    logger.log("info", "docker-compose kill\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    }
  });
}

function composeRm(){
  shell.exec('docker-compose kill', function(code, stdout, stderr) {
    logger.log("info", "docker-compose kill\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    } else {
      shell.exec('docker-compose rm -f', function(code, stdout, stderr) {
        logger.log("info", "docker-compose rm -f\n" + stdout);
        if (code !== 0) {
          logger.log('Error', "Code: " + code + ", msg: " + stderr);
          console.log('Error', "Code: " + code + ", msg: " + stderr);
        }
      })
    }
  });
}

function composeLogs(log){
  shell.config.silent = false;
  if (log == true){
  shell.exec('docker-compose logs -f --tail=500', function(code, stdout, stderr) {
    console.log(stdout);
    if (code !== 0) {
          logger.log('Error', "Code: " + code + ", msg: " + stderr);
          console.log('Error', "Code: " + code + ", msg: " + stderr);
      }
  });
  } else {
  shell.exec("docker-compose logs -f --tail=500 " + log, function(code, stdout, stderr) {
    console.log(stdout);
    if (code !== 0) {
          logger.log('Error', "Code: " + code + ", msg: " + stderr);
          console.log('Error', "Code: " + code + ", msg: " + stderr);
      }
  });
  }
}

function dragonInit(){
  getInterface()
    .then(validateDocker)
    .then(loadEnv)
    .then(loadPlatform)
    .then(getUserInputs);
}

function validateConfigs(){
  if (shell.test('-f', confFile)) {
    return true;
  }
  console.log("Run " + chalk.red("dragon init") + " to initialize the system");
  return false;
}

if (process.argv.length == 2) {
  getInterface().then(function() {
    var promise = new Promise(function(resolve, reject){
      setTimeout(function(){
        console.log("Usage: " + chalk.red("dragon [option]"));
        console.log("       " + chalk.red("dragon --help") + "\t to view available options\n");
      resolve({data:'200'});
      }, 200);
    });
    return promise;
  });
} else {
  loadEnv()
    .then(loadPlatform);
}


if (cmd.start || cmd.desktop) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composeBuildAndRun();
  }
}

if (cmd.init) {
  if (validateConfigs()){
    shell.cd(homeDir);
    dragonInit();
  }
}

if (cmd.server) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composePullAndRun();
  }
}

if (cmd.ps) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composePs();
  }
}

if (cmd.build) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composeBuild();
  }
}

if (cmd.stop) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composeStop();
  }
}

if (cmd.kill) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composeKill();
  }
}

if (cmd.rm) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composeRm();
  }
}

if (cmd.logs) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composeLogs(cmd.logs);
  }
}

if (cmd.push) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composePush();
  }
}

if (cmd.pull) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composePull();
  }
}
