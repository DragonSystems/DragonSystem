#!/usr/bin/env node
var program = require('commander');
var figlet = require('figlet');
var chalk = require('chalk');
var inquirer = require('inquirer');

figlet.text('    dragon system    ', {
    font: 'ogre',
    horizontalLayout: 'default',
    verticalLayout: 'default'
}, function(err, data) {
    if(!err){
        console.log(chalk.bold.hex('#FF0033')(data));
        console.log(chalk.hex('#C8C420')('                                                                   v0.01'));
        installWhere();
    }
});

function installWhere(){
    inquirer.prompt([
        {
            type: 'list',
            message: 'Where are you installing the Dragon System?',
            name: 'install',
            choices: [
            {
                name: 'Web Server'
            },
            {
                name: 'Desktop'
            }
            ],
            validate: function (answer) {
            if (answer.length < 1) {
                return 'You must choose at least one install location.';
            }
            return true;
            }
        }
        ]).then(function (answers) {
            if(answers.install[0] == 'Desktop'){
                installDesktop();
            } else {
                installServer();
            }
        });
}

function installDesktop(){
    inquirer.prompt([
        {
            type: 'checkbox',
            message: 'Path to storage volume',
            name: 'desktop',
            choices: [
            {
                name: 'Web Server'
            },
            {
                name: 'Desktop'
            }
            ],
            validate: function (answer) {
            if (answer.length < 1) {
                return 'You must choose at least one install location.';
            }
            return true;
            }
        }
        ]).then(function (answers) {
            if(answers.install[0] == 'Desktop'){
                console.log('Dektop')
            } else {
                console.log('Server')
            }
        });
}