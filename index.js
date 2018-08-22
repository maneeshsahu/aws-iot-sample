/** 
This node.js Lambda function code creates and attaches an IoT policy to the 
just-in-time registered certificate. It also activates the certificate. The Lambda
function is attached as a rule engine action to the registration topic 
Saws/events/certificates/registered/<caCertificateID>
**/

// Modify these strings and messages

const AWSregion = 'us-east-1'; // us-east-1
const Certificate = require('@fidm/x509').Certificate;

const AWS = require('aws-sdk');
AWS.config.update({
    region: AWSregion
});
    
exports.handler = function(event, context, callback) {
    
    //Replace it with the AWS region the lambda will be running in
    var region = AWSregion;
    
    var accountId = event.awsAccountId.toString().trim();

    var iot = new AWS.Iot({'region': region, apiVersion: '2015-05-28'});
    var dynamoDB = new AWS.DynamoDB();
    var certificateId = event.certificateId.toString().trim();
    
     //Replace it with your desired topic prefix
    var topicName = `foo/bar/${certificateId}`;

    var certificateARN = `arn:aws:iot:${region}:${accountId}:cert/${certificateId}`;
    var policyName = `Policy_${certificateId}`;
    
    //Policy that allows connect, publish, subscribe and receive
    var policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "iot:Connect"
                ],
                "Resource": `arn:aws:iot:${region}:${accountId}:client/${certificateId}`
            },
            {
                "Effect": "Allow",
                "Action": [
                    "iot:Publish",
                    "iot:Receive"
                ],
                "Resource": `arn:aws:iot:${region}:${accountId}:topic/${topicName}/*`
            },
            {
                "Effect": "Allow",
                "Action": [
                    "iot:Subscribe",
                ],
                "Resource": `arn:aws:iot:${region}:${accountId}:topicfilter/${topicName}/#`
            }
        ]
    };

    /*
    Step 1) Create a policy
    */
    iot.createPolicy({
        policyDocument: JSON.stringify(policy),
        policyName: policyName
    }, (err, data) => {
        //Ignore if the policy already exists
        if (err && (!err.code || err.code !== 'ResourceAlreadyExistsException')) {
            console.log(err);
            callback(err, data);
            return;
        }
        console.log(data);
        
        /*
        Step 2) Attach the policy to the certificate
        */
        iot.attachPrincipalPolicy({
            policyName: policyName,
            principal: certificateARN
        }, (err, data) => {
            //Ignore if the policy is already attached
            if (err && (!err.code || err.code !== 'ResourceAlreadyExistsException')) {
                console.log(err);
                callback(err, data);
                return;
            }
            console.log(data);
            /*
            Step 3) Lookup Whitelist Table in DynamoDB. If a match exists then update
            certificate status to ACTIVE
            */
            iot.describeCertificate({'certificateId': certificateId}, function(err2, data2) {
               if (err) {
                 callback(err2, data2);       
               }    
               else {
                console.log(data2);
                var certPem = data2.certificateDescription.certificatePem;
            
                var cert = Certificate.fromPEM(certPem);
                console.log(cert.serialNumber);
                console.log(cert.issuer.commonName);

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
                        callback(error, dynamodata);
                    } else {
                        console.log("GetItem succeeded:", JSON.stringify(dynamodata, null, 2));
                        /*
                        Step 4) Activate the certificate. 
                        */
                        iot.updateCertificate({
                            certificateId: certificateId,
                            newStatus: 'ACTIVE'
                        }, (err, data) => {
                            if (err) {
                                console.log(err, err.stack); 
                                callback(err, data);
                            }
                            else {
                                console.log(data);   
                                callback(null, "Success, created, attached policy and activated the certificate " + certificateId);
                            }
                        });
                    }
                });
               }
            });
        });
    });
}
