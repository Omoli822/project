#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Validation function
validate_input() {
    local input="$1"
    local error_msg="$2"
    while [[ -z "$input" ]]; do
        read -p "$error_msg" input
    done
    echo "$input"
}

# Collect inputs
company_name=$(validate_input "$company_name" "Enter your company name: ")
website_name=$(validate_input "$website_name" "Enter your legal website name (e.g., com.company.app): ")
port=$(validate_input "$port" "Choose a port for the server (default: 3000): ")
port=${port:-3000}

while true; do
    read -p "Is the server online? (yes/no): " online
    if [[ "$online" == "yes" || "$online" == "no" ]]; then
        break
    fi
    echo -e "${YELLOW}Please enter 'yes' or 'no'${NC}"
done

business_type=$(validate_input "$business_type" "Enter the type of business: ")

# OpenAI Integration Prompt
read -p "Do you want to integrate OpenAI API? (yes/no): " openai_integration

if [[ "$openai_integration" == "yes" ]]; then
    while true; do
        read -sp "Enter your OpenAI API Key (will be securely stored): " openai_api_key
        echo
        if [[ ! -z "$openai_api_key" ]]; then
            break
        else
            echo -e "${RED}API Key cannot be empty. Please try again.${NC}"
        fi
    done

    read -p "Choose OpenAI model (gpt-3.5-turbo/gpt-4/gpt-4-turbo): " openai_model
    openai_model=${openai_model:-gpt-3.5-turbo}
fi

# Create database name (replace spaces and convert to lowercase)
db_name=$(echo "${company_name// /_}" | tr '[:upper:]' '[:lower:]')_db

# Create database if it doesn't exist
echo "Creating database ${db_name}..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS \`${db_name}\`;"

# Create config.json
cat > config.json << EOL
{
  "companyName": "$company_name",
  "websiteName": "$website_name",
  "port": $port,
  "online": "$online",
  "businessType": "$business_type",
  "openaiIntegration": "${openai_integration:-no}",
  "openaiModel": "${openai_model:-none}",
  "databaseName": "${db_name}"
}
EOL

# Create .env file with additional OpenAI configuration
cat > .env << EOL
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=${db_name}

OPENAI_API_KEY=${openai_api_key:-}
OPENAI_MODEL=${openai_model:-none}
PORT=$port
EOL

echo -e "${GREEN}Configuration saved to config.json and .env${NC}"

# Cross-platform database service management
echo "Setting up database..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew services start mysql || echo -e "${YELLOW}MySQL service already started.${NC}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo systemctl start mysql || echo -e "${YELLOW}MySQL service already started.${NC}"
else
    echo -e "${YELLOW}Unsupported OS. Please start MySQL manually.${NC}"
fi

# Install Node.js dependencies
echo "Installing dependencies..."
npm install express dotenv mysql2 openai
npm install

echo -e "${GREEN}Setup complete! Run 'npm start' to launch the server on port $port.${NC}"
npm start
echo -e "${GREEN}Setup complete!${NC} The server is running on port ${YELLOW}$port${NC}. Thank you for using amdm-manager!"

