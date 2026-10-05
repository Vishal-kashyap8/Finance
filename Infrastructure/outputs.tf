output "resource_group_id" {
  description = "Resource Group ID"
  value       = azurerm_resource_group.rg.id
}

output "app_service_plan_id" {
  description = "App Service Plan ID"
  value       = azurerm_service_plan.app_service_plan.id
}

output "app_service_id" {
  description = "App Service ID"
  value       = azurerm_linux_web_app.app_service.id
}

output "app_service_default_hostname" {
  description = "Default hostname of the App Service"
  value       = azurerm_linux_web_app.app_service.default_hostname
}

output "app_service_url" {
  description = "URL of the App Service"
  value       = "https://${azurerm_linux_web_app.app_service.default_hostname}"
}

output "app_service_possible_outbound_ip_addresses" {
  description = "Possible outbound IP addresses to allow in the Azure SQL firewall"
  value       = azurerm_linux_web_app.app_service.possible_outbound_ip_address_list
}

output "sql_server_fqdn" {
  description = "Fully qualified Azure SQL server host"
  value       = azurerm_mssql_server.sql_server.fully_qualified_domain_name
}
