#!/bin/bash

# Script para carregar variáveis de ambiente do .env para o sistema
# Lê o arquivo .env e exporta as variáveis para o ambiente atual

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Definir o caminho do arquivo .env
ENV_FILE=".env"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header "Carregando variáveis do $ENV_FILE"

# Verificar se arquivo .env existe
if [ ! -f "$PROJECT_ROOT/$ENV_FILE" ]; then
    print_error "Arquivo $ENV_FILE não encontrado em $PROJECT_ROOT"
    exit 1
fi

print_success "Arquivo $ENV_FILE encontrado!"
echo

# Função para carregar e exportar variáveis do .env
load_env() {
    local env_file=$1
    local count=0
    
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Ignorar linhas vazias e comentários
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        
        # Remover espaços em branco
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        # Remover aspas do valor se existirem
        value=$(echo "$value" | sed 's/^["'"'"']//;s/["'"'"']$//')
        
        # Exportar a variável
        if [ -n "$key" ]; then
            export "$key"="$value"
            ((count++))
        fi
    done < "$env_file"
    
    echo "$count"
}

# Carregar variáveis
LOADED=$(load_env "$PROJECT_ROOT/$ENV_FILE")

print_success "Total de variáveis carregadas: $LOADED"
echo

# Exibir variáveis carregadas (sem valores sensíveis)
echo -e "${GREEN}Variáveis de ambiente configuradas:${NC}"
echo

while IFS='=' read -r key value || [ -n "$key" ]; do
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    if [ -n "$key" ]; then
        # Mascarar valores sensíveis
        display_value="$value"
        if [[ "$key" =~ (KEY|SECRET|PASSWORD|TOKEN|URL) ]]; then
            display_value=$(echo "$value" | sed 's/^["'"'"']//;s/["'"'"']$//')
            if [ ${#display_value} -gt 15 ]; then
                display_value="${display_value:0:15}***"
            fi
        fi
        
        echo "  • $key=$display_value"
    fi
done < "$PROJECT_ROOT/$ENV_FILE"

echo
print_header "Configuração Concluída"

echo -e "${GREEN}Todas as variáveis do .env foram carregadas para o ambiente!${NC}"
echo

echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. npm install         # Instalar dependências"
echo "  2. npm run start:dev   # Iniciar em modo desenvolvimento"
echo

print_success "Ambiente pronto!"