import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WorkflowViewer } from '@orchstep/workflow-viewer'

const DEFAULT_YAML = `name: example-deploy
desc: Build, test, and deploy

tasks:
  build:
    desc: Build the application
    steps:
      - name: compile
        func: shell
        do: go build -o app ./cmd/app
        timeout: 60s

      - name: test
        func: shell
        do: go test ./...
        retry:
          max_attempts: 2
          interval: 5s

  deploy:
    desc: Deploy to environment
    steps:
      - name: run_build
        task: build

      - name: check_env
        if: '{{ eq vars.environment "production" }}'
        task: deploy_prod
        else: deploy_staging

  deploy_prod:
    steps:
      - name: push
        func: shell
        do: docker push myapp:latest

      - name: apply
        func: shell
        do: kubectl apply -f prod.yml
        timeout: 30s
        catch:
          - name: rollback
            func: shell
            do: kubectl rollout undo deployment/app

  deploy_staging:
    steps:
      - name: apply
        func: shell
        do: kubectl apply -f staging.yml
`

function App() {
  const [yaml, setYaml] = useState(DEFAULT_YAML)

  return (
    <>
      <div id="editor">
        <div style={{ padding: '8px 16px', background: '#eee', fontSize: 12, fontWeight: 600 }}>
          YAML Editor
        </div>
        <textarea
          value={yaml}
          onChange={e => setYaml(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div id="viewer">
        <WorkflowViewer yaml={yaml} />
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
