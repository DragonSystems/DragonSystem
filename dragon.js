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
var datetime = require('node-datetime');

shell.config.silent = true;
var homeDir = path.join(os.homedir(), ".dragon");
var workspace = os.homedir();
var debug = "Enable";
var site = "www.example.com";
var api = "api.example.com";
var apiKey = "12345678901234567890";
var siteImage = "latest"
var apiImage = "latest"
var storeImage = "latest"
var certsImage = "latest"
var proxyImage = "latest"
var logfile = path.join(homeDir, "dragon.log");
var confFile = path.join(homeDir, ".env");
var platformFile = path.join(homeDir, "platform.env");
var composeFile = path.join(homeDir, "docker-compose.yaml");

shell.mkdir('-p', homeDir);

logger.add(logger.transports.File, {filename: logfile});
logger.remove(logger.transports.Console);

cmd.option('ps', 'Show running status')
  .option('init', 'initialize configurations')
  .option('start', 'Start dragon system. (For servers use server option)')
  .option('server', 'Initialize dragon system in a server environment')
  .option('build', 'Build custom docker images')
  .option('logs [name]', 'Get docker logs',  /^(site|api|store|proxy|certs|parity)$/i)
  .option('stop', 'Stop all running dockers')
  .option('kill', 'Forcefully stop all running dockers')
  .option('rm', 'Clear all stopped docker containers')
  .option('push', 'Push build docker images to a docker registry')
  .option('pull', 'Pull all docker images from a docker registries')
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
        resolve({data:'200'});
      });
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
            } else {
              shell.exec('git --version', function(code, stdout, stderr) {
                if (code !== 0) {
                  logger.log('Error', "git command not found,\nmsg: " + code + ", " + stderr);
                  console.log('Error', "git command not found,\nmsg: " + code + ", " + stderr);
                  console.log("Use this guide to install " + chalk.bold("git") +
                    " in the system:\n\t" + chalk.italic("https://git-scm.com/book/en/v2/Getting-Started-Installing-Git"));
                  process.exit(0);
                } else {
                  resolve({data:'200'});
                }
              });
            }
          });
        }
      });
    }, 200);
  });
  return promise;
}

var getSource = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      console.log("Cloning DragonSite ...")
      shell.exec("git clone https://github.com/DragonSystems/DragonSite.git ", function(code, stdout, stderr) {
        if (code !== 0) {
              logger.log('Error', "Code: " + code + ", msg: " + stderr);
              console.log('Error', "Code: " + code + ", msg: " + stderr);
          } else {
            console.log("Cloning DragonAPI ...")
            shell.exec("git clone https://github.com/DragonSystems/DragonAPI.git ", function(code, stdout, stderr) {
              if (code !== 0) {
                    logger.log('Error', "Code: " + code + ", msg: " + stderr);
                    console.log('Error', "Code: " + code + ", msg: " + stderr);
                } else {
                  shell.sed('-i', 'WORKSPACE=.*', "WORKSPACE=" + shell.pwd(), confFile);
                  resolve({data:'200'});
                }
            });
          }
      });
    }, 5000);
  });
  return promise;
}

var loadEnv = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      if (shell.test('-f', confFile)) {
        properties.parse(confFile, {path: true}, function (error, data){
          workspace = data.WORKSPACE;
          siteImage = data.SITE_IMAGE;
          storeImage = data.STORE_IMAGE;
          certsImage = data.CERTS_IMAGE;
          proxyImage = data.PROXY_IMAGE;
          apiImage = data.API_IMAGE;
          resolve({data:'200'});
        });
      }
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
          api = data.API_HOSTNAME;
          resolve({data:'200'});
        });
      }
    }, 200);
  });
  return promise;
}

var getServerInputs = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      inquirer.prompt([
      {
        type: 'input',
        name: 'siteImage',
        message: 'dragon-site image tag: ',
        default: siteImage
      },
      {
        type: 'input',
        name: 'apiImage',
        message: 'dragon-api image tag: ',
        default: apiImage
      }
      ]).then(function (answers) {
        apiImage = answers.apiImage;
        siteImage = answers.siteImage;
        shell.sed('-i', 'SITE_IMAGE=.*', "SITE_IMAGE=" + siteImage, confFile);
        shell.sed('-i', 'API_IMAGE=.*', "API_IMAGE=" + apiImage, confFile);
        resolve({data:'200'});
      });
    }, 2000);
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
        name: 'apiHostname',
        message: 'API domain name:',
        default: api,
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
      //{
      //  type: 'input',
      //  name: 'siteImage',
      //  message: 'dragon-site image tag: ',
      //  default: siteImage
      //},
      //{
      //  type: 'input',
      //  name: 'apiImage',
      //  message: 'dragon-api image tag: ',
      //  default: apiImage
      //},
      //{
      //  type: 'input',
      //  name: 'storeImage',
      //  message: 'dragon-store image tag: ',
      //  default: storeImage
      //},
      //{
      //  type: 'input',
      //  name: 'certsImage',
      //  message: 'dragon-certs image tag: ',
      //  default: certsImage
      //},
      //{
      //  type: 'input',
      //  name: 'proxyImage',
      //  message: 'dragon-proxy image tag: ',
      //  default: proxyImage
      //},
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
        resolve({data:'200'});
      });
    }, 2000);
  });
  return promise;
}

function validateUserInputs(answers) {

  site = answers.siteHostname;
  api = answers.apiHostname;
  apiKey = answers.apiKey;
  debug = answers.debug;

  //siteImage = answers.siteImage;
  //storeImage = answers.storeImage;
  //certsImage = answers.certsImage;
  //proxyImage = answers.proxyImage;
  //apiImage = answers.apiImage;

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
  //shell.cd(homeDir);
  shell.cp(path.join(__dirname, "platform.env.example"), platformFile);
  shell.cp(path.join(__dirname, ".env"), confFile);
  shell.cp(path.join(__dirname, "docker-compose.yaml"), composeFile);
  shell.sed('-i', 'DEBUG=.*', "DEBUG=" + debug, platformFile);
  shell.sed('-i', 'SITE_HOSTNAME=.*', "SITE_HOSTNAME=" + site, platformFile);
  shell.sed('-i', 'API_HOSTNAME=.*', "API_HOSTNAME=" + api, platformFile);
  shell.sed('-i', 'SSL_API_KEY=.*', "SSL_API_KEY=" + apiKey, platformFile);
  //shell.sed('-i', 'SITE_IMAGE=.*', "SITE_IMAGE=" + siteImage, confFile);
  //shell.sed('-i', 'STORE_IMAGE=.*', "STORE_IMAGE=" + storeImage, confFile);
  //shell.sed('-i', 'CERTS_IMAGE=.*', "CERTS_IMAGE=" + certsImage, confFile);
  //shell.sed('-i', 'PROXY_IMAGE=.*', "PROXY_IMAGE=" + proxyImage, confFile);
  //shell.sed('-i', 'API_IMAGE=.*', "API_IMAGE=" + apiImage, confFile);
}

var getRegistryHome = function() {
  var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
      inquirer.prompt([
      {
        type: 'input',
        name: 'registryHome',
        message: 'Docker registry home',
        default: "docker.io/dragonsystems",
      }
      ]).then(function (answers) {
        var tag = datetime.create().format('YmdHM');
        apiImage = answers.registryHome + "/dragonapi:" + tag
        siteImage = answers.registryHome + "/dragonsite:" + tag
        shell.sed('-i', 'API_IMAGE=.*', "API_IMAGE=" + apiImage, confFile);
        shell.sed('-i', 'SITE_IMAGE=.*', "SITE_IMAGE=" + siteImage, confFile);
        resolve({data:'200'});
      });
    }, 200);
  });
  return promise;
}


function sourceBuild(){
  // build site
  shell.cd(workspace + "/DragonSite");
  shell.config.silent = false;
  console.log("Building DragonSite code base");
  shell.exec("npm install --verbose && bower install --verbose && polymer build", function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "Building source of DragonSite.\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
      shell.cd(workspace);
    } else {
      shell.config.silent = true;
      // build api
      shell.cd(workspace + "/DragonAPI");
      shell.config.silent = false;
      console.log("Building DragonAPI code base");
      shell.exec("npm install --verbose", function(code, stdout, stderr) {
        console.log(stdout);
        logger.log("info", "Building source of DragonAPI.\n" + stdout);
        if (code !== 0) {
          logger.log('Error', "Code: " + code + ", msg: " + stderr);
          console.log('Error', "Code: " + code + ", msg: " + stderr);
          shell.cd(workspace);
        } else {
          shell.cd(workspace);
        }
      });
    }
  });
}

var dockerBuild = function(){
  var promise = new Promise(function(resolve, reject){
    shell.cd(workspace + "/DragonSite");
    shell.config.silent = false;
    console.log("Building DragonSite custom docker image");
    shell.exec("docker build -t " + siteImage + " .", function(code, stdout, stderr) {
      logger.log("info", "Building DragonSite custom docker image\n" + stdout);
      if (code !== 0) {
        logger.log('Error', "Code: " + code + ", msg: " + stderr);
        console.log('Error', "Code: " + code + ", msg: " + stderr);
        shell.cd(workspace);
      } else {
        shell.config.silent = true;
        // build api
        shell.cd(workspace + "/DragonAPI");
        shell.config.silent = false;
        console.log("Building DragonAPI custom docker image");
        shell.exec("docker build -t " + apiImage + " .", function(code, stdout, stderr) {
          logger.log("info", "Building DragonAPI custom docker image\n" + stdout);
          if (code !== 0) {
            logger.log('Error', "Code: " + code + ", msg: " + stderr);
            console.log('Error', "Code: " + code + ", msg: " + stderr);
            shell.cd(workspace);
          } else {
            shell.cd(workspace);
            resolve({data:'200'});
          }
        });
      }
    });
  });
  return promise;
}

var dockerPush = function(){
  var promise = new Promise(function(resolve, reject){
    shell.config.silent = false;
    console.log("Pushing dragonsite to docker registry");
    shell.exec("docker push " + siteImage, function(code, stdout, stderr) {
      logger.log("Pushing dragonsite to docker registry\n" + stdout);
      if (code !== 0) {
        logger.log('Error', "Code: " + code + ", msg: " + stderr);
        console.log('Error', "Code: " + code + ", msg: " + stderr);
      } else {
        console.log("Pushing dragonapi to docker registry");
        shell.exec("docker push " + apiImage, function(code, stdout, stderr) {
          logger.log("Pushing dragonapi to docker registry\n" + stdout);
          if (code !== 0) {
            logger.log('Error', "Code: " + code + ", msg: " + stderr);
            console.log('Error', "Code: " + code + ", msg: " + stderr);
          } else {
            resolve({data:'200'});
          }
        });
      }
    });
  });
  return promise;
}

function composeUp(){
  console.log("Starting up docker containers ... ");
  logger.log("info", "Starting up docker containers");
  shell.config.silent = false;
  shell.exec('docker-compose up -d', function(code, stdout, stderr) {
    console.log(stdout);
    logger.log("info", "docker-compose up -d\n" + stdout);
    if (code !== 0) {
      logger.log('Error', "Code: " + code + ", msg: " + stderr);
      console.log('Error', "Code: " + code + ", msg: " + stderr);
    } else {
      console.log(chalk.blue("Update /etc/hosts entries to verify the setup."));
      console.log(chalk.underline.bgMagenta(chalk.white("$ sudo vim /etc/hosts")));
      console.log(chalk.blue("Add following lines to the file"));
      console.log(chalk.underline.bgBlue(chalk.white("127.0.0.1 " + site)));
      console.log(chalk.underline.bgBlue(chalk.white("127.0.0.1 " + api)));
      console.log(chalk.blue("Save and exit using \'<Esc> :wq\'"));
    }
  });
}

function composePull(){
  shell.config.silent = false;
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

//function composePullAndRun(){
//  console.log("Pulling docker images ... ");
//  logger.log("info", "Pulling docker images");
//  //getUserInputs().then(
//  // Get user inputs. pull and start
//  //);
//  shell.exec('docker-compose pull', function(code, stdout, stderr) {
//    console.log(stdout);
//    logger.log("info", "docker-compose pull\n" + stdout);
//    if (code !== 0) {
//      logger.log('Error', "Code: " + code + ", msg: " + stderr);
//      console.log('Error', "Code: " + code + ", msg: " + stderr);
//    } else {
//      console.log("Starting up docker containers ... ");
//      logger.log("info", "Starting up docker containers");
//      shell.exec('docker-compose up -d', function(code, stdout, stderr) {
//        console.log(stdout);
//        logger.log("info", "docker-compose up -d\n" + stdout);
//        if (code !== 0) {
//          logger.log('Error', "Code: " + code + ", msg: " + stderr);
//          console.log('Error', "Code: " + code + ", msg: " + stderr);
//        } else {
//          console.log(chalk.blue("Update DNS to point " + site + " and " + api + " to this server."));
//        }
//      });
//    }
//  });
//}

function composePush(){
  console.log("Pushing images to docker registry ... ");
  logger.log("info", "Pushing images to docker registry");
  // Build and push
  //shell.sed('-i', 'SITE_IMAGE=.*', "SITE_IMAGE=" + imageTag, confFile);
  //console.log("Building docker image for " + imageTag + " ... ");
  //logger.log("info", "Bilding docker images");
  //shell.exec("docker build -t " + imageTag + " .", function(code, stdout, stderr) {
  //  console.log(stdout);
  //  logger.log("info", "docker build -t " + imageTag + " .\n" + stdout);
  //  if (code !== 0) {
  //    logger.log('Error', "Code: " + code + ", msg: " + stderr);
  //    console.log('Error', "Code: " + code + ", msg: " + stderr);
  //  }
  //});
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
  //shell.cd(homeDir);
  //shell.cp(path.join(__dirname, "platform.env.example"), platformFile);
  //shell.cp(path.join(__dirname, ".env"), confFile);
  //shell.cp(path.join(__dirname, "docker-compose.yaml"), composeFile);
  validateDocker()
    .then(loadEnv)
    .then(loadPlatform)
    .then(getInterface)
    .then(getUserInputs)
    .then(getSource);
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

if (cmd.start) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composeUp();
  }
}

if (cmd.init) {
  dragonInit();
}

if (cmd.server) {
  validateDocker()
    .then(loadEnv)
    .then(loadPlatform)
    .then(getInterface)
    .then(getUserInputs)
    .then(getServerInputs);
}

if (cmd.ps) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composePs();
  }
}

if (cmd.build) {
  if (validateConfigs()){
    loadEnv()
      .then(loadPlatform)
      .then(sourceBuild);
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
    getInterface()
      .then(getRegistryHome)
      .then(loadEnv)
      .then(loadPlatform)
      .then(dockerBuild)
      .then(dockerPush);
  }
}

if (cmd.pull) {
  if (validateConfigs()){
    shell.cd(homeDir);
    composePull();
  }
}
