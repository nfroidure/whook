# imports the cron lambda list
data "external" "cron_lambdas" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='lambdas'", "--lambdaType='cron'"]
}

resource "aws_cloudwatch_event_rule" "cloudwatch_event_rule" {
  for_each            = data.external.cron_lambdas.result
  name                = each.key
  description         = data.external.lambdaConfigurations[each.key].result["description"]
  schedule_expression = data.external.lambdaConfigurations[each.key].result["schedule"]
  is_enabled          = data.external.lambdaConfigurations[each.key].result["enabled"]
}

resource "aws_cloudwatch_event_target" "cloudwatch_event_target" {
  for_each  = data.external.cron_lambdas.result
  rule      = aws_cloudwatch_event_rule.cloudwatch_event_rule[each.key].name
  target_id = each.key
  arn       = aws_lambda_function.lambda_function[each.key].arn
}

resource "aws_lambda_permission" "lambda_permission" {
  for_each      = data.external.cron_lambdas.result
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function[each.key].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cloudwatch_event_rule[each.key].arn
}
