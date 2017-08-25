const express = require('express')
const app = express();

// Connect to IPFS
const ipfsAPI = require('ipfs-api')
const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'})

// If we want to set a file, we should post the file to http://localhost:9000/set
app.get('/set', function (req, res) {
    // Check the file is under 100k

    // Save the file to IPFS
    arr.push(filePair)
    ipfs.files.add(file, (err, res) => {
        // Once added pin the hash
        pinHash(res[0]);
        res.send(res[0]);
    })
})

// If we want to set a file, we should get the file to http://localhost:9000/df789g79f8g7d9f7g9dfg8dssdsdf
app.get('/get', function (req, res) {
    // isolate the hash from the GET url

    // is ethe hash to ge tthe file from IPFS

    // Check the file is under 100k
    res.send(file)
})

// Whenever we add a file we should pin it
function pinHash(IPFSHash){
    ipfs.pin.add(IPFSHash, function(err, res) {
        console.log(res);
    });
}

const PORT = 9000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST);