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
2. Specify the trigger to be - AWS IoT, configuring the JIT rule created earlier in AWS IoT.
3. In the Function Code:

  1. Choose 'Upload a .ZIP file'. Specify the deployment package - lambda-deployment.zip as the upload.
  2. Select 'Node.js 6.10' or above as the Runtime
  3. Select index.handler (default)
  4. For the Execution role, select 'Create a custom role'. In the Role Summary, create a new IAM Role - 'lambda_iot_dynamodb_execution'.
  5. For the policy name, Edit the Policy Document. Tweak [role_policy.json](../master/role_policy.json) by changing the resource for the DynamoDB policy with your DynamoDB Table's ARN.

6. Save the Function
7. Modify the [TestEvent.json](../master/TestEvent.json) by changing the details to match your AWS configuration
8. Test the Lambda function with the JSON 'Event'
9. If you see no errors, this function is ready to be used to register JIT certificates.










