data "aws_iam_policy_document" "iam_policy_document" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type = "Service"
      identifiers = [
        "lambda.amazonaws.com",
        "apigateway.amazonaws.com",
        "logs.amazonaws.com",
        "events.amazonaws.com",
        "sqs.amazonaws.com",
        "ec2.amazonaws.com",
        "s3.amazonaws.com"
      ]
    }
  }
}

data "aws_iam_policy_document" "iam_role_policy_document" {
  statement {
    resources = [
      "arn:aws:logs:*:*:*",
      "arn:aws:elasticache:*:*:*",
      "arn:aws:sqs:*:*:*",
      "arn:aws:s3:::*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ListQueues",
      "sqs:SendMessageBatch",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility",
      "sqs:GetQueueUrl",
      "sqs:ListQueueTags",
      "sqs:TagQueue",
      "sqs:UntagQueue",
      "sqs:PurgeQueue",
      "sns:Publish",
      "elasticache:*",
      "s3:ListAllMyBuckets",
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:GetObjectAcl"
    ]
    effect = "Allow"
  }
}

resource "aws_iam_role" "iam_role" {
  name               = "${terraform.workspace}_iam_policy_document"
  assume_role_policy = data.aws_iam_policy_document.iam_policy_document.json
}

resource "aws_iam_role_policy" "iam_role_policy" {
  name   = "${terraform.workspace}_iam_role_policy"
  role   = aws_iam_role.iam_role.id
  policy = data.aws_iam_policy_document.iam_role_policy_document.json
}

data "external" "envvars" {
  program     = ["env", "APP_ENV=${terraform.workspace}", "NODE_ENV=${var.node_env}", "npx", "whook", "terraformValues", "--type='envvars'"]
  working_dir = ".."
}

resource "aws_lambda_layer_version" "lambda_layer" {
  filename         = "../layer/lambda_layer.zip"
  layer_name       = "api-lambda-layer"
  description      = "A layer with all lambdas node modules"
  source_code_hash = filebase64sha256("../layer/lambda_layer.zip")
  # You may replace the above by the following to avoid pushing
  # a new layer when the package lock did not change
  # source_code_hash    = filebase64sha256("../package-lock.json")
  compatible_runtimes = ["nodejs20.x"]
}

data "archive_file" "lambdas" {
  for_each    = data.external.lambdas.result
  type        = "zip"
  source_dir  = "../builds/${terraform.workspace}/${each.key}"
  output_path = "../builds/${terraform.workspace}/${each.key}.zip"
}

resource "aws_lambda_function" "lambda_function" {
  for_each         = data.external.lambdas.result
  filename         = "../builds/${terraform.workspace}/${each.key}.zip"
  function_name    = "${terraform.workspace}_${each.key}"
  role             = aws_iam_role.iam_role.arn
  handler          = "index.default"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambdas[each.key].output_base64sha256
  memory_size      = split("|", each.value)[3]
  timeout          = split("|", each.value)[2]
  layers           = [aws_lambda_layer_version.lambda_layer.arn]
  environment {
    variables = zipmap(
      keys(data.external.envvars.result),
      [for key in keys(data.external.envvars.result) : data.external.envvars.result[key]]
    )
  }
  depends_on = [aws_cloudwatch_log_group.cloudwatch_log_group]
}

resource "aws_cloudwatch_log_group" "cloudwatch_log_group" {
  for_each          = data.external.lambdas.result
  name              = "/aws/lambda/${terraform.workspace}_${each.key}"
  retention_in_days = terraform.workspace == "production" ? 90 : 3
}
