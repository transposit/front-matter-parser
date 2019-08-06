## How to deploy:

```
npm install; zip -r ../tina-service-parser.zip *
AWS_PROFILE=tina-sandbox-lambda aws lambda update-function-code --function-name tina-service-parser --zip-file fileb://../tina-service-parser.zip
```

My Transposit app that uses this is:
https://console.staging.transposit.com/t/tina/service_parser

And some example SQL to call it is:
```
SELECT * FROM aws_lambda.invoke_function
  WHERE functionName='tina-service-parser'
  AND $body.service.name = @name
  AND $body.service.maintainer = @maintainer
```
