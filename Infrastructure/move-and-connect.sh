#!/bin/bash
# Script to move SQL Managed Instance to new resource group and configure App Service

echo "=========================================="
echo "SQL Managed Instance Move & Connection Script"
echo "=========================================="
echo ""

# Variables
SOURCE_RG="Az-DevOps-RG"
TARGET_RG="finance-rg"
MI_NAME="db-sql-mi-0569414"
SUBSCRIPTION_ID="6ae8940e-c219-47f2-94de-f638865862c8"
APP_SERVICE_NAME="finance-app-001"

# Step 1: Get Managed Instance details
echo "Step 1: Retrieving Managed Instance details..."
MI_ID=$(az sql mi show \
  --name $MI_NAME \
  --resource-group $SOURCE_RG \
  --subscription $SUBSCRIPTION_ID \
  --query id -o tsv)

if [ -z "$MI_ID" ]; then
  echo "ERROR: Could not find managed instance: $MI_NAME"
  exit 1
fi

echo "✓ Found Managed Instance: $MI_ID"
echo ""

# Step 2: Move the Managed Instance
echo "Step 2: Moving Managed Instance to target resource group..."
echo "This may take several minutes..."
az resource move \
  --ids $MI_ID \
  --destination-group $TARGET_RG \
  --subscription $SUBSCRIPTION_ID

if [ $? -eq 0 ]; then
  echo "✓ Managed Instance moved successfully!"
else
  echo "✗ Failed to move Managed Instance"
  exit 1
fi
echo ""

# Step 3: Get connection details
echo "Step 3: Retrieving connection details..."
MI_FQDN=$(az sql mi show \
  --name $MI_NAME \
  --resource-group $TARGET_RG \
  --subscription $SUBSCRIPTION_ID \
  --query fullyQualifiedDomainName -o tsv)

echo "✓ Managed Instance FQDN: $MI_FQDN"
echo ""

# Step 4: Display connection string
echo "Step 4: Connection Configuration"
echo "========================================"
echo "Add these environment variables to your App Service:"
echo ""
echo "DATABASE_SERVER: $MI_FQDN"
echo "DATABASE_PORT: 3342"
echo "DATABASE_NAME: <your_database_name>"
echo "DATABASE_USERNAME: <your_username>"
echo "DATABASE_PASSWORD: <your_password>"
echo ""
echo "Connection String Format (for Node.js):"
echo "Server=tcp:$MI_FQDN,3342;Initial Catalog=<your_database>;User Id=<your_username>;Password=<your_password>;"
echo ""

# Step 5: Configure App Service Settings
echo "Step 5: Configuring App Service with database settings..."
read -p "Enter your database name: " DB_NAME
read -p "Enter your database username: " DB_USER
read -sp "Enter your database password: " DB_PASS
echo ""

# Set app service connection strings
az webapp config appsettings set \
  --name $APP_SERVICE_NAME \
  --resource-group $TARGET_RG \
  --subscription $SUBSCRIPTION_ID \
  --settings \
  DATABASE_HOST=$MI_FQDN \
  DATABASE_PORT=3342 \
  DATABASE_NAME=$DB_NAME \
  DATABASE_USER=$DB_USER \
  DATABASE_PASSWORD=$DB_PASS \
  DATABASE_DIALECT=mssql

if [ $? -eq 0 ]; then
  echo "✓ App Service configured successfully!"
else
  echo "✗ Failed to configure App Service settings"
  exit 1
fi
echo ""

echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "Your Managed Instance has been moved and your App Service is configured."
echo "The connection details are stored as environment variables in the App Service."
echo ""
