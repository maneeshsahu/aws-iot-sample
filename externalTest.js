/** 
This node.js script exercises AWS SDK functions to:

1. Describe Certificate using the AWS IoT Certificate ID
2. Parse the returned Certificate PEM using @fidm/x509
3. Lookup Whitelist Item using the certificate serial number and subject commonName

This needs to be ported into the Lambda function. 
Since @fidm/x509 is an external npm module, it needs to be zipped up and uploaded to S3.
**/

// Modify these strings and messages
const AWSregion = 'us-east-1'; // us-east-1
const { Certificate, PrivateKey } = require('@fidm/x509');

var certificateId = '852c2b92cda889ad8bdadb96012ada9b5520a14460fb63ebcaa187b42155199c'; // Replace with your certificate ID

const AWS = require('aws-sdk');
AWS.config.update({
    region: AWSregion
});

var dynamoDB = new AWS.DynamoDB();


var iot = new AWS.Iot();
iot.describeCertificate({'certificateId': certificateId}, function(err, data) {
   if (!err) {
    console.log(data);
    //var response = JSON.parse(data);
    var certPem = data.certificateDescription.certificatePem;

    var cert = Certificate.fromPEM(certPem);
    console.log(cert.serialNumber);
    console.log(cert.issuer.commonName);
    //console.log(cert);
    var params = {
        TableName: "Whitelist",
        Key: {
            "IssuerCN": {
                S: cert.issuer.commonName
            },
            "SerialNumber": {
                S: cert.serialNumber
            }
        }
    };

    dynamoDB.getItem(params, function(error, dynamodata) {
        if (error) {
            console.error("Unable to lookup DynamoDB whitelist item. Error JSON:", JSON.stringify(error, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(dynamodata, null, 2));
        }
    });
   }
});
