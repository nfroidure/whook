data "external" "functionConfiguration" {
  for_each = data.external.functions.result

  program = ["env", "APP_ENV=${terraform.workspace}", "NODE_ENV=${var.node_env}", "npx", "whook", "terraformValues", "--type='function'", "--functionName='${each.key}'"]
}

resource "google_storage_bucket" "storage_bucket" {
  name = "whook_functions"
}

data "archive_file" "functions" {
  for_each = data.external.functions.result

  type        = "zip"
  source_dir  = "./builds/${terraform.workspace}/${each.key}"
  output_path = "./builds/${terraform.workspace}/${each.key}.zip"
}

resource "google_storage_bucket_object" "storage_bucket_object" {
  for_each = data.external.functions.result

  name       = "${terraform.workspace}_${each.key}"
  source     = "./builds/${terraform.workspace}/${each.key}.zip"
  bucket     = google_storage_bucket.storage_bucket.name
  depends_on = [data.archive_file.functions]
}

resource "google_cloudfunctions_function" "cloudfunctions_function" {
  for_each = data.external.functions.result

  name        = "${terraform.workspace}_${each.key}"
  description = data.external.functionConfiguration[each.key].result["description"]
  runtime     = "nodejs10"

  available_memory_mb   = data.external.functionConfiguration[each.key].result["memory"]
  timeout               = data.external.functionConfiguration[each.key].result["timeout"]
  source_archive_bucket = google_storage_bucket.storage_bucket.name
  source_archive_object = google_storage_bucket_object.storage_bucket_object[each.key].name
  trigger_http          = true
  entry_point           = "default"
}

# Seems to not work (no idea why)
# resource "google_cloudfunctions_function_iam_member" "invoker" {
#   for_each = data.external.functions.result

#   project        = google_cloudfunctions_function.cloudfunctions_function[each.key].project
#   region         = google_cloudfunctions_function.cloudfunctions_function[each.key].region
#   cloud_function = google_cloudfunctions_function.cloudfunctions_function[each.key].name

#   role           = "roles/cloudfunctions.invoker"
#   member         = "allUsers"
# }
