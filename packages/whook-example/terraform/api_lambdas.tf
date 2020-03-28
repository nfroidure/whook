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

resource "aws_api_gateway_method" "api_gateway_method" {
  for_each    = data.external.api_lambdas.result
  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
  resource_id = (
    split("|", each.value)[1] == "0" ?
    aws_api_gateway_resource.api_gateway_resource0[split("|", each.value)[0]].id :
    aws_api_gateway_resource.api_gateway_resource1[split("|", each.value)[0]].id
  )
  http_method   = data.external.lambdaConfigurations[each.key].result["method"]
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "api_gateway_integration" {
  for_each                = data.external.api_lambdas.result
  rest_api_id             = aws_api_gateway_rest_api.api_gateway_rest_api.id
  resource_id = (
    split("|", each.value)[1] == "0" ?
    aws_api_gateway_resource.api_gateway_resource0[split("|", each.value)[0]].id :
    aws_api_gateway_resource.api_gateway_resource1[split("|", each.value)[0]].id
  )
  http_method             = aws_api_gateway_method.api_gateway_method[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda_function[each.key].invoke_arn
}
