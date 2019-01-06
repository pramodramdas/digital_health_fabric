# digital healthcare on hyperledger fabric
This is api server which interacts with healtcare chaincode installed on hyperledger fabric basic_network.

### Steps to setup chaincode:
* Bring fabric basic_network up  
* Register chaincode from root folder  
  CORE_CHAINCODE_ID_NAME="healthcare:v0" npm start -- --peer.address localhost:7052
* Login to cli  
  docker exec -it cli bash
* Install chaincode  
  peer chaincode install -n healthcare -v v0 -l node --cafile /etc/hyperledger/configtx/ -p /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/digital_health_fabric/
  #### Note: I had copied this project to crypto-config(basic_network) and attached volume to cli container using docker-compose
  ####       volumes: 
  ####          - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
* instantiate chaincode  
  peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n healthcare -l node -v v0 -c '{"args":["init"]}'
* Optional invoke using cli,
  peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n healthcare -c '{"Args":["registerPatient","patient5","20"]}'
  
### Steps to interact with digital healthcare chaincode using node sdk.
* Remove any files from hfc-key-store folder
* Register admin to ca  
  node enrollAdmin.js
* Start server  
  node server.js
* Test chaincode and api  
  npm run test
  
### List of apis
* Register doctor  
  ``` POST /register  
  {
    "name":"doctor1",
    "email": "doctor1",
    "password": "doctor1",
    "role": "doctor"
  }
  ```
  
  
