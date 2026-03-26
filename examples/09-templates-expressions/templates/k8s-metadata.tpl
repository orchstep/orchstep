---
# Common metadata template for Kubernetes resources
name: {{ .vars.app_name }}
namespace: {{ .vars.namespace }}
labels:
  app: {{ .vars.app_name }}
  environment: {{ .vars.environment }}
  managed-by: orchstep
