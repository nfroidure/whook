# imports the lambda list
data "external" "lambdas" {
  program     = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='lambdas'"]
  working_dir = ".."
}
