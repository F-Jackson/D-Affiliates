#!/bin/bash
# Script para exportar todas as variáveis do .env
export $(grep -v '^#' /workspaces/D-Affiliates/.env | grep -v '^$' | xargs)
