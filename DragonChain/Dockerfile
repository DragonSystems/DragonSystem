FROM ubuntu:14.04
RUN apt-get install software-properties-common && \
add-apt-repository -y ppa:ethereum/ethereum && \
apt-get update && \
apt-get install geth
CMD geth --fast --cache=16 --jitvm --datadir=/mnt/eth-blockchain --identity=@bkawk --keystore=/mnt/eth-blockchain --rpc --rpcport=8882 --rpccorsdomain=* --rpcapi=web3,db,net,eth