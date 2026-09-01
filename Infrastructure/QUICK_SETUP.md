# Quick Setup Guide - Move Managed Instance & Configure App Service

## Step 1: Move Managed Instance (Run these commands one by one)

```powershell
# Set variables
$SourceRG = "Az-DevOps-RG"
$TargetRG = "finance-rg"
$MIName = "db-sql-mi-0569414"
$SubscriptionID = "6ae8940e-c219-47f2-94de-f638865862c8"

# Get Managed Instance ID
$MI_ID = az sql mi show --name $MIName --resource-group $SourceRG --subscription $SubscriptionID --query id --output tsv

Write-Host "Moving Managed Instance: $MI_ID"

# Move the resource (this may take 10-15 minutes)
az resource move --ids $MI_ID --destination-group $TargetRG --subscription $SubscriptionID

Write-Host "Managed Instance moved successfully!"
```

## Step 2: Get Connection Details

```powershell
# Get the FQDN
$MI_FQDN = az sql mi show --name $MIName --resource-group $TargetRG --subscription $SubscriptionID --query fullyQualifiedDomainName --output tsv

Write-Host "Managed Instance FQDN: $MI_FQDN"
```

## Step 3: Configure App Service (Save these values first)

You need:
- Database name (e.g., financedb)
- Database username (e.g., sqladmin)
- Database password

```powershell
# Set app service configuration
az webapp config appsettings set `
  --name finance-app-001 `
  --resource-group finance-rg `
  --subscription $SubscriptionID `
  --settings `
  DATABASE_HOST="<your_MI_FQDN>" `
  DATABASE_PORT="3342" `
  DATABASE_NAME="<your_database_name>" `
  DATABASE_USER="<your_username>" `
  DATABASE_PASSWORD="<your_password>" `
  DATABASE_DIALECT="mssql"
```

Replace the values in angle brackets with your actual database credentials.

## Verify Configuration

```powershell
# View all app settings
az webapp config appsettings list --name finance-app-001 --resource-group finance-rg --output table
```

## Connection String for Your App

```
Server=tcp:<your_MI_FQDN>,3342;Initial Catalog=<database_name>;User Id=<username>;Password=<password>;
```
