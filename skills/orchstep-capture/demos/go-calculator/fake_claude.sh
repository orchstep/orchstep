#!/usr/bin/env bash
# Fake Claude Code REPL — demo GIF rendering only.
# Reads a single user prompt + /orchstep-capture, prints canned output, exits.

set -u

prompt() { printf "\n> "; }

prompt
while IFS= read -r line; do
  case "$line" in
    *calculator*|*Build*|*build*|*Sum*)
      sleep 0.3
      echo
      echo "● go mod init calculator"
      sleep 0.2
      echo "  go: creating new go.mod: module calculator"
      sleep 0.3
      echo "● Writing calculator.go (Sum function)"
      sleep 0.3
      echo "● Writing calculator_test.go (3 table-driven cases)"
      sleep 0.3
      echo "● go test -v ./..."
      sleep 0.1
      echo "  === RUN   TestSum"
      echo "  --- PASS: TestSum/two_plus_three (0.00s)"
      echo "  --- PASS: TestSum/neg_one_plus_one (0.00s)"
      echo "  --- PASS: TestSum/zero_plus_zero (0.00s)"
      echo "  PASS    ok  calculator    0.21s"
      sleep 0.3
      echo "● go vet ./...   (clean)"
      sleep 0.3
      echo "● Done. module=calculator func=Sum tests=3 status=PASS"
      ;;
    /orchstep-capture)
      sleep 0.4
      echo
      echo "● Compressing session into orchstep.yml ..."
      sleep 1.2
      echo "● Wrote orchstep.yml (6 steps, replayable)"
      sleep 0.5
      break
      ;;
    *) ;;
  esac
  prompt
done
echo
