import React from 'react'
import { createRoot } from 'react-dom/client'
import { WorkflowViewer } from '../src'

// Example 1: CI/CD Pipeline — shows conditions, task calls, error handling
const CICD_YAML = `name: ci-cd-pipeline
desc: Build, test, and deploy with environment branching

tasks:
  build:
    desc: Build and test the application
    steps:
      - name: compile
        func: shell
        do: go build -o app ./cmd/app
        timeout: 120s

      - name: unit_test
        func: shell
        do: go test ./... -cover
        retry:
          max_attempts: 2
          interval: 5s

      - name: lint
        func: shell
        do: golangci-lint run

  deploy:
    desc: Deploy to target environment
    steps:
      - name: run_build
        task: build

      - name: check_env
        if: '{{ eq vars.environment "production" }}'
        task: deploy_prod
        else: deploy_staging

  deploy_prod:
    desc: Production deployment with safety checks
    steps:
      - name: push_image
        func: shell
        do: docker push myapp:latest

      - name: apply_k8s
        func: shell
        do: kubectl apply -f k8s/prod.yml
        timeout: 60s
        retry:
          max_attempts: 3
          interval: 10s
        catch:
          - name: rollback
            func: shell
            do: kubectl rollout undo deployment/myapp

      - name: health_check
        func: http
        args:
          url: https://api.example.com/health
          method: GET
        retry:
          max_attempts: 5
          interval: 3s

  deploy_staging:
    desc: Staging deployment
    steps:
      - name: apply_staging
        func: shell
        do: kubectl apply -f k8s/staging.yml

      - name: notify
        func: http
        args:
          url: https://hooks.slack.com/services/xxx
          method: POST
`

// Example 2: Data Pipeline — shows loops, modules, multiple functions
const DATA_YAML = `name: data-pipeline
desc: ETL pipeline with validation and reporting

modules:
  - name: slack
    source: github.com/orchstep/modules/slack-notify
    version: "^1.0.0"
    config:
      channel: "#data-ops"

tasks:
  extract:
    desc: Extract data from sources
    steps:
      - name: fetch_api
        func: http
        args:
          url: https://api.datasource.com/export
          method: GET
        timeout: 300s
        outputs:
          raw_data: "{{ result.body }}"

      - name: download_files
        func: shell
        do: aws s3 sync s3://data-bucket/raw ./data/raw

  transform:
    desc: Transform and validate data
    steps:
      - name: run_extract
        task: extract

      - name: clean_data
        func: shell
        do: python scripts/clean.py --input ./data/raw
        timeout: 600s

      - name: validate
        func: assert
        args:
          condition: '{{ gt steps.clean_data.row_count 0 }}'
          desc: Data must have rows after cleaning

  load:
    desc: Load into data warehouse
    steps:
      - name: run_transform
        task: transform

      - name: upload
        func: shell
        do: python scripts/load.py --target warehouse
        timeout: 900s
        retry:
          max_attempts: 3
          interval: 30s

      - name: notify_team
        module: slack
        task: send
        with:
          message: "Data pipeline complete"
`

const params = new URLSearchParams(window.location.search)
const example = params.get('example') || 'cicd'
const yaml = example === 'data' ? DATA_YAML : CICD_YAML

function App() {
  return <WorkflowViewer yaml={yaml} direction="AUTO" theme="light" />
}

createRoot(document.getElementById('root')!).render(<App />)
