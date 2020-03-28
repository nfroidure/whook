provider "aws" {
  version = "~> 2.54"
  region  = "us-east-1"
}

provider "archive" {
  version = "~> 1.3"
}

output api_url {
  value = aws_api_gateway_deployment.api_gateway_deployment.invoke_url
}

output queue_url {
  value = aws_sqs_queue.sqs_queue.id
}

# imports the lambda list
data "external" "lambdas" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='lambdas'"]
}
