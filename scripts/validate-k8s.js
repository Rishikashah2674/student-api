const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const manifestFiles = [
  'k8s/00-namespace.yaml',
  'k8s/01-configmap.yaml',
  'k8s/02-secrets.yaml.example',
  'k8s/user-service.yaml',
  'k8s/product-service.yaml',
  'k8s/order-service.yaml',
  'k8s/api-gateway.yaml',
  'k8s/monitoring/01-prometheus-configmap.yaml',
  'k8s/monitoring/02-prometheus.yaml',
  'k8s/monitoring/03-grafana-datasources.yaml',
  'k8s/monitoring/04-grafana.yaml'
];

let totalDocs = 0;
let errors = 0;

console.log("🔍 Validating Kubernetes YAML Manifests...");

for (const relPath of manifestFiles) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${relPath}`);
    errors++;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  try {
    const docs = YAML.parseAllDocuments(content);
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (doc.errors.length > 0) {
        console.error(`❌ Syntax error in ${relPath} (document #${i + 1}):`, doc.errors);
        errors++;
      } else {
        totalDocs++;
        const parsed = doc.toJSON();
        if (!parsed || !parsed.apiVersion || !parsed.kind) {
          console.warn(`⚠️ Warning: Missing apiVersion or kind in ${relPath}`);
        }
      }
    }
    console.log(`✅ [OK] ${relPath} (${docs.length} resource document${docs.length > 1 ? 's' : ''})`);
  } catch (err) {
    console.error(`❌ Parse exception in ${relPath}: ${err.message}`);
    errors++;
  }
}

if (errors === 0) {
  console.log(`\n🎉 Success! All ${totalDocs} Kubernetes resource manifests parsed with 0 errors.`);
  process.exit(0);
} else {
  console.error(`\n❌ Failed with ${errors} error(s).`);
  process.exit(1);
}
