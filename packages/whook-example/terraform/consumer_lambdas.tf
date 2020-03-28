# Consumers are very different depending on use cases,
#  for example, you could pipe a Kinesis stream or
#  a SQS queue (like here) into a consumer. This is
#  why we do not automate their use. That said you 
#  can refers to built consumers lambdas easily like
#  showed here

# Creating a SQS queue
resource "aws_sqs_queue" "sqs_queue" {
  name                        = "${terraform.workspace}_sqs_queue"
  delay_seconds               = 0
  message_retention_seconds   = 345600
  receive_wait_time_seconds   = 0
  visibility_timeout_seconds  = 600
  fifo_queue                  = false
  content_based_deduplication = false
  redrive_policy              = <<-JSON
    {"deadLetterTargetArn":"${aws_sqs_queue.sqs_queue_dlq.arn}","maxReceiveCount":3}
    JSON
}

data "aws_sqs_queue" "sqs_queue_data" {
  name = "${terraform.workspace}_sqs_queue"
  depends_on = [aws_sqs_queue.sqs_queue]
}

# Creating another SQS queue for DLQ messages
resource "aws_sqs_queue" "sqs_queue_dlq" {
  name                        = "${terraform.workspace}_sqs_queue_dlq"
  delay_seconds               = 0
  message_retention_seconds   = 1209600
  receive_wait_time_seconds   = 0
  visibility_timeout_seconds  = 30
  fifo_queue                  = false
  content_based_deduplication = false
}

data "aws_sqs_queue" "sqs_queue_dlq_data" {
  name = "${terraform.workspace}_sqs_queue_dlq"
  depends_on = [aws_sqs_queue.sqs_queue_dlq]
}

# Finally pipe the queue to our handleMessages consumer
resource "aws_lambda_event_source_mapping" "lambda_event_source_mapping" {
  batch_size       = 10
  event_source_arn = aws_sqs_queue.sqs_queue.arn
  enabled          = true
  function_name    = aws_lambda_function.lambda_function["handleMessages"].arn
}
