apiVersion: apps/v1
kind: Deployment
metadata:
  {{ templateFile "templates/k8s-metadata.tpl" }}
spec:
  replicas: {{ .vars.replicas }}
  template:
    metadata:
      labels:
        app: {{ .vars.app_name }}
    spec:
      containers:
      - name: {{ .vars.app_name }}
        image: {{ .vars.image }}:{{ .vars.tag }}
