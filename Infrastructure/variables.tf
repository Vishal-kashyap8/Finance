variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "finance-rg"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
  default     = "finance-app-plan"
}

variable "app_service_name" {
  description = "Name of the App Service"
  type        = string
  default     = "finance-app"
}

variable "sku_name" {
  description = "SKU for App Service Plan (F1=Free, B1=Basic)"
  type        = string
  default     = "F1" # F1 is the free tier, B1 is basic tier
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "Finance"
}

variable "sql_server_name" {
  description = "Globally unique name for the Azure SQL logical server"
  type        = string
  default     = "finance-sql-server-001"
}

variable "sql_admin_username" {
  description = "SQL administrator login for initial database provisioning"
  type        = string
  default     = "financeadmin"
}

variable "sql_admin_password" {
  description = "SQL administrator password; supply through TF_VAR_sql_admin_password"
  type        = string
  sensitive   = true
}
