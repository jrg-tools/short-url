resource "cloudflare_record" "x" {
  zone_id = var.zone_id
  name    = var.subdomain
  type    = "CNAME"
  ttl     = 1
  proxied = true
  content = replace(replace(aws_api_gateway_deployment.x.invoke_url, "https://", ""), "/", "")
  #content = aws_api_gateway_domain_name.jrg_tools.cloudfront_domain_name
}

# Download CA from Cloudflare
data "cloudflare_origin_ca_root_certificate" "root" {
  algorithm = "rsa"
} # data.cloudflare_origin_ca_root_certificate.root.cert_pem

# Create and register custom SSL cert
#resource "cloudflare_custom_ssl" "jrg_tools" {
#  zone_id = var.zone_id
#  custom_ssl_options {
#    certificate      = "-----INSERT CERTIFICATE-----"
#    private_key      = "-----INSERT PRIVATE KEY-----"
#    bundle_method    = "ubiquitous"
#    geo_restrictions = "highest_security"
#  }
#}

## Custom domain on API Gateway
#data "aws_acm_certificate" "x" {
#  domain   = "*.${var.domain}"
#  statuses = ["ISSUED"]
#  provider = aws.us-east-1
#}
#resource "aws_api_gateway_domain_name" "jrg_tools" {
#  domain_name     = "${var.subdomain}.${var.domain}"
#  certificate_arn = data.aws_acm_certificate.x.arn
#}

#resource "aws_api_gateway_base_path_mapping" "jrg_tools" {
#api_id      = aws_api_gateway_rest_api.x.id
#stage_name  = aws_api_gateway_stage.x.stage_name
#domain_name = aws_api_gateway_domain_name.jrg_tools.domain_name
#}
