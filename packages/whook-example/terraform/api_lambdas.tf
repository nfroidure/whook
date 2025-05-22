# imports the cron lambda list
data "external" "api_lambdas" {
  program     = ["env", "APP_ENV=${terraform.workspace}", "NODE_ENV=${var.node_env}", "npx", "whook", "terraformValues", "--type='lambdas'", "--lambdaType='http'"]
  working_dir = ".."
}

resource "aws_lambda_permission" "lambdas" {
  for_each      = data.external.api_lambdas.result
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function[each.key].arn
  principal     = "apigateway.amazonaws.com"
}
