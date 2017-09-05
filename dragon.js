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

var homeDir = path.join(os.homedir(), ".dragon");
var environment = "Desktop"
var debug = false;
var site = "";
var socket = "";
var apiKey = "";
var dockerRegistry = "";
var logfile = path.join(homeDir, "dragon.log");
shell.config.silent = true;

shell.mkdir('-p', homeDir);

logger.add(logger.transports.File, { filename: logfile });
logger.remove(logger.transports.Console);

cmd.option('ps', 'Show running status')
  .option('run', 'Run dockers')
  .option('build', 'Build dockers')
  .option('logs', 'Get docker logs')
  .option('stop', 'Stop all running dockers')
  .option('kill', 'Forcefully stop all running dockers')
  .option('rm', 'Clear all stopped docker containers')
  .option('push', 'Push build docker images to a docker registry')
  .version('0.1.0', '-v, --version', 'Output the version number')
  .parse(process.argv);

if (process.argv.length == 2) {
  figlet.text('    dragon system    ', {
    font: 'Ogre',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }, function(err, data) {
    if(err){
      console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
      logger.log('error', err);
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
    message: 'NS1 API key:',
    validate: function(str) {
      if (validator.isByteLength(str, 20, 20)) {
        return true;
      }
      return "Please check the API key again ... "
    }
  },
  {
    type: 'input',
    name: 'siteHostname',
    message: 'Site domain name:',
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
    validate: function(str) {
      if (validator.isFQDN(str)) {
        return true;
      }
      return "Please enter a fully qualified domain name."
    }
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
      logger.log("info", "Starting install");
      updatePlatformEnv();
    } else {
      process.exit(0);
    }
  });
}

function updatePlatformEnv() {
  console.log("Updating configurations ... ");
  logger.log("info", "Updating configurations");
  shell.cd(homeDir);
  shell.cp(path.join(__dirname, "platform.env.example"), path.join(homeDir, "platform.env"));
  shell.cp(path.join(__dirname, "docker-compose.yaml"), path.join(homeDir, "docker-compose.yaml"));
  shell.ln('-sf', path.join(__dirname, "DragonCerts"), path.join(homeDir, "DragonCerts"));
  shell.ln('-sf', path.join(__dirname, "DragonChain"), path.join(homeDir, "DragonChain"));
  shell.ln('-sf', path.join(__dirname, "DragonProxy"), path.join(homeDir, "DragonProxy"));
  shell.ln('-sf', path.join(__dirname, "DragonSite"), path.join(homeDir, "DragonSite"));
  shell.ln('-sf', path.join(__dirname, "DragonSockets"), path.join(homeDir, "DragonSockets"));
  shell.ln('-sf', path.join(__dirname, "DragonStore"), path.join(homeDir, "DragonStore"));
  if(debug == "false"){
    shell.sed('-i', 'DEBUG=.*', "#DEBUG=1", 'platform.env');
  }
  shell.sed('-i', 'SITE_HOSTNAME=.*', "SITE_HOSTNAME=" + site, 'platform.env');
  shell.sed('-i', 'SOCKET_HOSTNAME=.*', "SOCKET_HOSTNAME=" + socket, 'platform.env');
  shell.sed('-i', 'SSL_API_KEY=.*', "SSL_API_KEY=" + apiKey, 'platform.env');
  runCompose();
}

function buildDockerImages(){
  console.log("Building docker images ... ");
  logger.log("info", "Bilding docker images");
  var bar = new ProgressBar('Building docker images - :name [:bar] :percent', {total: 50});
  bar.tick(1, {'name': 'certs'});
  sleep(1000);
  shell.exec('docker-compose build certs', function(code, stdout, stderr) {
    logger.log("info", stdout);
    if (code !== 0) {
      logger.log('error', "Error code: " + code + ", error : " + stderr);
      console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
    }
  });
  bar.tick(9, {'name': 'proxy'});
  sleep(1);
  shell.exec('docker-compose build proxy', function(code, stdout, stderr) {
    logger.log("info", stdout);
    if (code !== 0) {
      logger.log('error', "Error code: " + code + ", error : " + stderr);
      console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
    }
  });
  bar.tick(10, {'name': 'site'});
  sleep(1);
  shell.exec('docker-compose build site', function(code, stdout, stderr) {
    logger.log("info", stdout);
    if (code !== 0) {
      logger.log('error', "Error code: " + code + ", error : " + stderr);
      console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
    }
  });
  bar.tick(10, {'name': 'socket'});
  sleep(1);
  shell.exec('docker-compose build socket', function(code, stdout, stderr) {
    logger.log("info", stdout);
    if (code !== 0) {
      logger.log('error', "Error code: " + code + ", error : " + stderr);
      console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
    }
  });
  bar.tick(10, {'name': 'store'});
  sleep(1);
  shell.exec('docker-compose build store', function(code, stdout, stderr) {
    logger.log("info", stdout);
    if (code !== 0) {
      logger.log('error', "Error code: " + code + ", error : " + stderr);
      console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
    }
  });
  bar.tick(10, {'name': 'store'});
  sleep(1);


}

function runCompose(build){

  if(environment == "Desktop"){
    shell.cd(homeDir);
    buildDockerImages();
    console.log("Starting up docker containers ... ");
    logger.log("info", "Starting up docker containers");
    shell.exec('docker-compose up -d', function(code, stdout, stderr) {
      logger.log("info", "docker-compose up -d\n" + stdout);
      if (code !== 0) {
        logger.log('error', "Error code: " + code + ", error : " + stderr);
        console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
      }
    });
    console.log(chalk.blue("Update /etc/hosts entries to verify the setup."));
    console.log(chalk.underline.bgMagenta(chalk.white("$ sudo vim /etc/hosts")));
    console.log(chalk.blue("Add following lines to the file"));
    console.log(chalk.underline.bgBlue(chalk.white("127.0.0.1 " + site)));
    console.log(chalk.underline.bgBlue(chalk.white("127.0.0.1 " + socket)));
    console.log(chalk.blue("Save and exit using \'<Esc> :wq\'"));
  } else {
    //console.log("Pulling docker images from " + dockerRegistry + " ... ");
    //logger.log("info", "Pulling docker images from " + dockerRegistry);
    //shell.exec('docker-compose pull', function(code, stdout, stderr) {
    //      logger.log("info", stdout);
    //  if (code !== 0) {
    //        logger.log('error', "Error code: " + code + ", error : " + stderr);
    //        console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
    //    }
    //});
    console.log("Starting up docker containers ... ");
    logger.log("info", "Starting up docker containers");
    shell.exec('docker-compose up -d', function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
        logger.log('error', "Error code: " + code + ", error : " + stderr);
        console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
      }
    });
    console.log(chalk.blue("Update DNS to point " + site + " and " + socket + " to this server."));
  }
}

if (cmd.ps) {
  shell.cd(homeDir);
  shell.exec('docker-compose ps', function(code, stdout, stderr) {
      console.log(stdout);
      logger.log("info", "docker-compose ps\n " + stdout);
      if (code !== 0) {
        logger.log('error', "Error code: " + code + ", error : " + stderr);
        console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
      }
    });
}

if (cmd.run) {
  shell.cd(homeDir);
  shell.exec('docker-compose up -d', function(code, stdout, stderr) {
      logger.log("info", "docker-compose up -d\n" + stdout);
      if (code !== 0) {
        logger.log('error', "Error code: " + code + ", error : " + stderr);
        console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
      }
    });
}

if (cmd.build) {
  shell.cd(homeDir);
  buildDockerImages();
}

if (cmd.stop) {
  shell.cd(homeDir);
  shell.exec('docker-compose stop', function(code, stdout, stderr) {
      logger.log("info", "docker-compose stop\n" + stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
}

if (cmd.kill) {
  shell.cd(homeDir);
  shell.exec('docker-compose kill', function(code, stdout, stderr) {
      logger.log("info", "docker-compose kill\n" + stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
}

if (cmd.rm) {
  shell.cd(homeDir);
  shell.exec('docker-compose rm -f', function(code, stdout, stderr) {
      logger.log("info", "docker-compose rm -f\n" + stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
}

if (cmd.logs) {
  shell.cd(homeDir);
  shell.exec('docker-compose logs -f', function(code, stdout, stderr) {
      console.log(stdout);
      //logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
}

if (cmd.push) {
  shell.cd(homeDir);
  inquirer.prompt([
  {
    type: 'input',
    name: 'registry',
    message: 'Docker registry :'
  },
  {
    type: 'input',
    name: 'certsVersion',
    message: 'dragon-certs version: ',
    default: 'latest'
  },
  {
    type: 'input',
    name: 'proxyVersion',
    message: 'dragon-proxy version: ',
    default: 'latest'
  },
  {
    type: 'input',
    name: 'socketVersion',
    message: 'dragon-socket version: ',
    default: 'latest'
  },
  {
    type: 'input',
    name: 'siteVersion',
    message: 'dragon-site version: ',
    default: 'latest'
  },
  {
    type: 'input',
    name: 'storeVersion',
    message: 'dragon-store version: ',
    default: 'latest'
  }]).then(function (answers) {
    dockerRegistry = answers.registry;
    certsDocker = dockerRegistry + "/dragon-certs:" + answers.certsVersion;
    proxyDocker = dockerRegistry + "/dragon-proxy:" + answers.proxyVersion;
    socketDocker = dockerRegistry + "/dragon-socket:" + answers.socketVersion;
    siteDocker = dockerRegistry + "/dragon-site:" + answers.siteVersion;
    storeDocker = dockerRegistry + "/dragon-store:" + answers.storeVersion;
    shell.exec("docker tag dragon-certs " + certsDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker tag dragon-proxy " + proxyDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker tag dragon-socket " + socketDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker tag dragon-site " + siteDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker tag dragon-store " + storeDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    console.log("Pushing images to: " + dockerRegistry + " ... ");
    logger.log("info", "Pushing images to: " + dockerRegistry);
    shell.exec("docker push " + certsDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker push " + proxyDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker push " + socketDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker push " + siteDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
    shell.exec("docker push " + storeDocker, function(code, stdout, stderr) {
      logger.log("info", stdout);
      if (code !== 0) {
            logger.log('error', "Error code: " + code + ", error : " + stderr);
            console.log('Something went wrong. Please check the log in \"' + logfile +  '\" for more info.');
        }
    });
  });
}
