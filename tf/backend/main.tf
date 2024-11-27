resource "aws_s3_bucket" "s3-terraform-state-storage" {
  bucket = var.bucket

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "Terraform S3 Remote State Store"
  }
}

resource "aws_s3_bucket_public_access_block" "s3-terraform-state-storage" {
  bucket = aws_s3_bucket.s3-terraform-state-storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
