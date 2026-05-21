output "api_url" {
  value = aws_api_gateway_deployment.api_gateway_deployment.invoke_url
}

# output "regional_url" {
#   value = aws_api_gateway_domain_name.api_gateway_domain_name.regional_domain_name
# }

output "queue_url" {
  value = aws_sqs_queue.sqs_queue.id
}
