# aws-iot-sample

This document assumes that you have an AWS Account.

This document uses the following AWS Services:
- AWS IoT
- IAM
- Lambda
- DynamoDB
- S3

## DynamoDB
The Lambda function checks the JIT registered certificate against a whitelist stored in DynamoDB. The DynamoDB has one Table with two attributes:
- IssuerCN - The CommonName of the certificate's Issuer
- SerialNumber - The SerialNumber of the certificate

To create the Table, use the [Whitelist-DynamoDB.json](../master/Whitelist-DynamoDB.json) as the parameters.

Insert items in the newly created Table for whitelisted certificates. 

## AWS IoT

### Register CA Certificate
Follow AWS IoT Documentation to register the CA Certificate for JIT Registration

### Create JIT Rule
Create a Rule to act on newly detected certificates associated with the CA certificate.

```
SELECT * FROM '$aws/events/certificates/registered/605324c6cbbce99455bfa9b781b22c3b9bbe80a9c4df51b2b5ff81022f53a8ee'
```
Replace '605324c6cbbce99455bfa9b781b22c3b9bbe80a9c4df51b2b5ff81022f53a8ee' with your CA certificate's AWS Certificate ID.

## Lambda

### Create the Lambda Deployment Package
From the command-line go to the root directory where this git repository is cloned and run the command below:

```
zip -r ../lambda-deployment.zip .
```
This creates an archive in the parent directory - lambda-deployment.zip.

### Create the Lambda Function



1. Create a Lambda function for whitelisting the JIT registered certificates.
2. Specify the trigger to be an AWS IoT event, specifying the JIT rule created earlier.
3. Update the [role_policy.json](../master/role_policy.json) by changing the resource for the DynamoDB policy with your own ARN.
4. Create a new Role for the Lambda function and use the role_policy.json as the policy document.  
5. Upload the deployment package - lambda-deployment.zip to use as the code.
6. Save the Function
7. Modify the [TestEvent.json](../master/TestEvent.json) by changing the details to match your AWS configuration
8. Test the Lambda function with the JSON 'Event'
9. If you see no errors, this function is ready to be used to register JIT certificates.










