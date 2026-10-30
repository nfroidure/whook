# imports the cron lambda list
data "external" "cron_lambdas" {
  program     = ["env", "APP_ENV=${terraform.workspace}", "NODE_ENV=${var.node_env}", "npx", "whook", "terraformValues", "--type='lambdas'", "--lambdaType='cron'"]
  working_dir = ".."
}
# imports the cron lambda schedules
data "external" "cron_lambdas_schedules" {
  program     = ["env", "APP_ENV=${terraform.workspace}", "NODE_ENV=${var.node_env}", "npx", "whook", "terraformValues", "--type='schedules'"]
  working_dir = ".."
}

resource "aws_cloudwatch_event_rule" "cloudwatch_event_rule" {
  for_each            = data.external.cron_lambdas_schedules.result
  name                = each.key
  description         = split("|", each.value)[0]
  schedule_expression = split("|", each.value)[1]
  is_enabled          = split("|", each.value)[2]
}

resource "aws_cloudwatch_event_target" "cloudwatch_event_target" {
  for_each  = data.external.cron_lambdas_schedules.result
  rule      = aws_cloudwatch_event_rule.cloudwatch_event_rule[each.key].name
  target_id = each.key
  arn       = aws_lambda_function.lambda_function[split("|", each.value)[0]].arn
  input_transformer {
    input_paths = {
      version     = "$.version",
      id          = "$.id",
      detail-type = "$.detail-type",
      detail      = "$.detail",
      source      = "$.source",
      account     = "$.account",
      time        = "$.time",
      region      = "$.region",
      resources   = "$.resources",
    }
    input_template = <<EOF
{
  "version": <version>,
  "id": <id>,
  "detail-type": <detail-type>,
  "detail": <detail>,
  "source": <source>,
  "account": <account>,
  "time": <time>,
  "region": <region>,
  "resources": <resources>,
  "body": ${split("|", each.value)[3]}
}
EOF
  }
}

resource "aws_lambda_permission" "lambda_permission" {
  for_each      = data.external.cron_lambdas_schedules.result
  statement_id  = "AllowExecutionFromCloudWatch${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function[split("|", each.value)[0]].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cloudwatch_event_rule[each.key].arn
}
