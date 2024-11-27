locals {
  binary_path  = "${path.module}/tf_generated/${var.handler}"
  src_path     = "../"
  archive_path = "${local.binary_path}.zip"
}

output "binary_path" {
  value = local.binary_path
}

output "aws_url" {
  value = aws_api_gateway_deployment.x.invoke_url
}

output "cf_url" {
  value = "https://${cloudflare_record.x.hostname}/"
}

variable "bucket" {
  default = "terraform-backend-jrg-tools"
}

variable "name" {
  default = "x-short-url"
}

variable "handler" {
  default = "bootstrap"
}

variable "domain" {
  default = "jrg.tools"
}

variable "subdomain" {
  default = "x"
}

variable "zone_id" {
  type = string
}
