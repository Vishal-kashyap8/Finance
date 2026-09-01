# Reference existing SQL Managed Instance
data "azurerm_mssql_managed_instance" "existing_instance" {
  name                = "db-sql-mi-0569414"
  resource_group_name = "Az-DevOps-RG"
}

# Output the connection string for the app
output "managed_instance_id" {
  description = "Existing Managed Instance ID"
  value       = data.azurerm_mssql_managed_instance.existing_instance.id
}

output "managed_instance_fqdn" {
  description = "Fully Qualified Domain Name of Managed Instance"
  value       = data.azurerm_mssql_managed_instance.existing_instance.fqdn
}

output "connection_string" {
  description = "Connection string for the managed instance"
  value       = "Server=tcp:${data.azurerm_mssql_managed_instance.existing_instance.fqdn},3342;Initial Catalog=<your_database>;User Id=<your_username>;Password=<your_password>;"
  sensitive   = true
}
