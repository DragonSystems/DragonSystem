![](http://i.imgur.com/NjzAc7S.png)

The Dragon System is a production class development framework and API for Ethereum web apps.

* Ethereum
* Polymer
* PRPL Server
* Socket.io
* Keythereum 
* JSON Web Signatures
* Express
* GunDB
* Nginx
* Parity
* Solidity
* Truffle


### Install dragon-system

`sudo npm install -g dragon-system`

### Run a test setup

#### Initialize the system

`dragon init`

```         _                                             _                     
      __| |_ __ __ _  __ _  ___  _ __    ___ _   _ ___| |_ ___ _ __ ___      
     / _` | '__/ _` |/ _` |/ _ \| '_ \  / __| | | / __| __/ _ \ '_ ` _ \     
    | (_| | | | (_| | (_| | (_) | | | | \__ \ |_| \__ \ ||  __/ | | | | |    
     \__,_|_|  \__,_|\__, |\___/|_| |_| |___/\__, |___/\__\___|_| |_| |_|    
                     |___/                   |___/                           
                                                                   v0.01
? Site domain name: www.drageth.com
? Socket domain name: sws.drageth.com
? NS1 API key: <20 character api key>
? dragon-site image tag:  docker.io/dragonsystems/dragonsite:0.0.1
? dragon-socket image tag:  docker.io/dragonsystems/dragonapi:0.0.1
? dragon-store image tag:  docker.io/dragonsystems/dragonstore:0.0.1
? dragon-certs image tag:  docker.io/dragonsystems/dragoncert:0.0.1
? dragon-proxy image tag:  docker.io/dragonsystems/dragonproxy:0.0.1
? Debug mode enabled or disabled? Enable
? Continue on installation? Yes
```

Note:-  You have to obtain an NS1 API key and two domain to proceed. 

#### Pull docker images from docker hub

`dragon pull`

Note:- This will take some time in the initial run since it has to grab all images from the docker hub.

#### Start docker containers

`dragon start`

```Starting up docker containers ... 

Update /etc/hosts entries to verify the setup.
$ sudo vim /etc/hosts
Add following lines to the file
127.0.0.1 www.drageth.com
127.0.0.1 sws.drageth.com
Save and exit using '<Esc> :wq'
```

#### Verify docker are running properly

`dragon ps`

```     Name               Command         State            Ports                                  
----------------------------------------------------------------------
dragon_certs_1    /bin/sh -c /startup   Up      80/tcp                                                                 
dragon_chain_1    /parity/parity        Up      0.0.0.0:8080->8080/tcp
dragon_proxy_1    /bin/sh -c /startup   Up      0.0.0.0:443->443/tcp, 
dragon_site_1     node server.js        Up      8080/tcp                                                               
dragon_socket_1   node socket.js        Up      8011/tcp                                                               
dragon_store_1    /bin/sh -c /startup   Up      4001/tcp, 5001/tcp, 90
```

#### Check logs of each system

`dragon logs <certs/site/etc...>`

```Attaching to dragon_certs_1
certs_1   | Reading environment variables ...
certs_1   | SITE_HOSTNAME=www.drageth.com
certs_1   | SOCKET_HOSTNAME=sws.drageth.com
certs_1   | SSL_API_KEY=***********900
certs_1   | Certs already exist for domain : www.drageth.com
certs_1   | Certs already exist for domain : sws.drageth.com
certs_1   | Starting ... 
certs_1   | 172.18.0.7 - - [14/Sep/2017 14:42:33] "GET / HTTP/1.1" 200 -
certs_1   | Cron is running - Thu Sep 14 14:43:02 UTC 2017
certs_1   | Cron is running - Thu Sep 14 14:44:01 UTC 2017
certs_1   | Cron is running - Thu Sep 14 14:45:01 UTC 2017
certs_1   | Cron is running - Thu Sep 14 14:46:01 UTC 2017
```

#### Stop the setup 

`dragon stop`

#### Forcefully kill (optional)

`dragon kill`

#### Remove stopped/killed container volumes

`dragon rm`

### Build your own site

First of all run a test setup, it will validate the environment and install basic images for you.

#### Get the site source code

Go to a desired directory and run;

`dragon get Site`

This will clone the DragonSite to the current directory. Do you modifications in that and run following command in the root of that directory.

`dragon build`

```[localhost DragonSite]$ dragon build
? Build component Site
? Image tag name:  docker.io/dragonsystem/customname:0.0.1-rc1
Building code for Site ... 
```

It will build the source code and then build the docker image with the given tag.

#### Push the build docker image to registry.

`dragon push` 

It will push the images to the registry as mentioned in the tag

### Run it in a server

#### Initialize server configurations

`dragon server`

In the server initialization, give the custom tag you gave for the site and use others as defaults. Make sure you disable debug option to get proper live certificates from Let's encrypt

#### Pull docker images from docker hub

`dragon pull`

#### Start docker containers

`dragon start`

```Starting up docker containers ... 

Update /etc/hosts entries to verify the setup.
$ sudo vim /etc/hosts
Add following lines to the file
127.0.0.1 www.drageth.com
127.0.0.1 sws.drageth.com
Save and exit using '<Esc> :wq'
```

Ignore the hosts update and add DNS entries to point to the running server.
