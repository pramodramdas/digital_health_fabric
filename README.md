# digital healthcare on hyperledger fabric
This is api server which interacts with healtcare chaincode installed on hyperledger fabric basic_network.

Refer below urls.  
https://github.com/hyperledger/fabric-samples  
https://github.com/pramodramdas/digital_healthcare


### Steps to setup chaincode:
* Bring fabric basic_network up  
* Register chaincode from root folder  
  ```CORE_CHAINCODE_ID_NAME="healthcare:v0" npm start -- --peer.address localhost:7052```
* Login to cli  
  ```docker exec -it cli bash```
* Install chaincode  
  ```peer chaincode install -n healthcare -v v0 -l node --cafile /etc/hyperledger/configtx/ -p /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/digital_health_fabric/```
  ##### Note: I had copied this project to crypto-config(basic_network) and attached volume to cli container using docker-compose
  #####       volumes: 
  #####          - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
* instantiate chaincode  
  ```peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n healthcare -l node -v v0 -c '{"args":["init"]}'```
* Optional invoke using cli,
  ```peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n healthcare -c '{"Args":["registerPatient","patient5","20"]}'```
  
### Steps to interact with digital healthcare chaincode using node sdk.
* Remove any files from hfc-key-store folder
* Register admin to ca  
  ```node enrollAdmin.js```
* Start server  
  ```node server.js```
* Test chaincode and api  
  ```npm run test```
  
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
* Register Patient  
  ``` POST /register  
  {
    "name":"patient1",
    "email": "patient1",
    "password": "patient1",
    "age": "24",
    "role": "patient"
  }
  ```
* Login patient and doctor  
  POST /login
  ```{
    "email": "patient2",
    "password": "patient2"
  }
  ```
  same for doctor  
  ##### Note: This api returns authtoken is login success. we need to pass this token as "authtoken" in header to other apis.  
* Patient grant access to doctor (use patient authtoken)  
  ```POST /modifyAccess  
  {
    "type": "grant",
    "doctorEmail": "doctor2",
    "org":"org1"
  }
  ```
* fetch patient info for doctor after access (use doctor authtoken, useremail=<patient_email>)  
   ```GET /getPatientInfo  
   ```
   ##### Note: patient info successfully fetched if and only if doctor has been granted access by patient.
* fetch patient info for himself (use patient authtoken)  
  ```GET /getPatientInfo```
  ##### Note: a patient can't see other patient's info.
* fetch doctor info for himself (use doctor authtoken)  
  ```GET /getDoctorInfo```
  ##### Note: a doctor can't see other doctor's info.
* patient upload file, first user has encrypt a file with secret and upload that file to ipfs.  
  hash returned from ipfs after upload and secret shoul be provided in below api, this api will attach file info to patient  
  ```POST /addFile  
  {
    "fileName":"abc.png", 
    "fileType":"png", 
    "secret":<ipfs file encryption secret>, 
    "fileHash":<ipfs file hash>
  }
  ```
* patient retrieve file info (use patient authtoken, filehash=<ipfs file hash>)  
  ```GET /getFileSecret```
* doctor retrieve file info (use doctor authtoken, filehash=<ipfs file hash>, useremail=<patient_email>)  
  ```GET /getFileSecret```
  ##### Note: doctor can retrieve file secret only if he as access to patient.  

  
