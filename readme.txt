//Register chaincode
CORE_CHAINCODE_ID_NAME="healthcare:v0" npm start -- --peer.address localhost:7052

//Install chaincode
peer chaincode install -n healthcare -v v0 -l node --cafile /etc/hyperledger/configtx/ -p /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/health_care/

//init chaincode
peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n healthcare -l node -v v0 -c '{"args":["init"]}'

//invoke chaincode
peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n healthcare -c '{"Args":["registerPatient","patient5","20"]}'

//upgrade

execut install with different version

peer chaincode upgrade -n healthcare -v v1 -c '{"args":["init"]}' -p /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/health_care/ -C mychannel -o orderer.example.com:7050
