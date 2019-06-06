## How to deploy:

```
npm install; zip -r ../tina-service-parser.zip *
AWS_PROFILE=tina-sandbox-lambda aws lambda update-function-code --function-name tina-service-parser --zip-file fileb://../tina-service-parser.zip
```
