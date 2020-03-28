# imports the cron lambda list
data "external" "api_lambdas" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='lambdas'", "--lambdaType='http'"]
}

resource "aws_lambda_permission" "lambdas" {
  for_each      = data.external.api_lambdas.result
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function[each.key].arn
  principal     = "apigateway.amazonaws.com"
}
