# Demo 09: AI Agent Task Pipeline

## Pain Point

AI agents are powerful but non-deterministic. When you call an LLM to perform a task, you face several operational challenges:

- **No audit trail** - You cannot prove what the AI produced, when, or with what parameters
- **Quality is unpredictable** - Sometimes the output is great, sometimes it misses key information
- **Retry logic is ad-hoc** - Developers write custom retry loops with no standardization
- **Cost is invisible** - Token usage and attempt counts are not tracked systematically
- **No checkpoints** - If the pipeline fails at step 4, you lose the work from steps 1-3

The core insight: AI execution is non-deterministic, but the orchestration around it should be deterministic. You need guaranteed logging, quality gates, retry policies, and persistence -- regardless of what the AI produces.

## What This Demo Shows

OrchStep provides the deterministic scaffolding around AI tasks:

- **Structured logging** - Every execution begins and ends with recorded metadata (task ID, timestamps, parameters)
- **Quality gates** - The AI output is scored against defined criteria before proceeding
- **Retry logic with feedback** - If quality is low, the pipeline can re-execute with adjusted parameters
- **Deterministic checkpoints** - Five named checkpoints create an audit trail through the pipeline
- **Result persistence** - Validated outputs are saved with full provenance metadata
- **Cost tracking** - Token usage and attempt counts flow through step outputs

## Running the Demo

```bash
# Default task
orchstep run

# Custom AI task
orchstep run --var task_description="Extract action items from meeting transcript" --var quality_threshold=8

# Stricter quality with fewer retries
orchstep run --var quality_threshold=9 --var max_retries=1
```

## Adapting for Production

1. **Connect to real LLM APIs** - Replace simulated execution with OpenAI, Anthropic, or local model API calls
2. **Implement actual quality scoring** - Use a second LLM call to evaluate output, or rule-based checks (regex for required fields, length checks, etc.)
3. **Add real retry with feedback** - On quality failure, append the quality feedback to the prompt and re-execute with higher temperature
4. **Persist to real storage** - Write results to S3, a database, or a vector store for retrieval
5. **Add cost controls** - Track cumulative token spend per task, set budget limits, alert on anomalies
6. **Human-in-the-loop** - Add an optional approval step between quality validation and persistence for high-stakes tasks
7. **Batch processing** - Use OrchStep's loop feature to process multiple AI tasks with shared quality gates
8. **Observability** - Feed checkpoint data into your monitoring system for dashboards on AI task success rates, average quality scores, and retry frequency
