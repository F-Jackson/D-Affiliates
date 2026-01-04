#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');
const protoDir = path.join(projectRoot, 'proto');
const srcProtoDir = path.join(projectRoot, 'src', 'proto');

// Criar diretório de saída se não existir
if (!fs.existsSync(srcProtoDir)) {
  fs.mkdirSync(srcProtoDir, { recursive: true });
}

// Lista de arquivos proto para gerar
const protoFiles = ['affiliates.proto', 'services_affiliates.proto'];

protoFiles.forEach((protoFile) => {
  const fullPath = path.join(protoDir, protoFile);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${fullPath}`);
    return;
  }

  try {
    console.log(`📝 Gerando TypeScript para ${protoFile}...`);
    
    // Usar proto-loader-gen-types com caminho absoluto
    execSync(
      `npx proto-loader-gen-types --longs=String --enums=json --defaults --keepCase --grpcLib=@grpc/grpc-js --outDir=${srcProtoDir} ${fullPath}`,
      {
        stdio: 'inherit',
        cwd: projectRoot,
      }
    );
    
    console.log(`✅ ${protoFile} gerado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao gerar ${protoFile}:`, error.message);
    process.exit(1);
  }
});

console.log('✨ Todos os arquivos proto foram gerados com sucesso!');

