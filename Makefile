.DEFAULT_GOAL := help

.PHONY: help install frontend-install backend-install \
	dev frontend-dev backend-dev \
	test frontend-test backend-tests \
	frontend-lint frontend-format frontend-build clean

help: ## Show this help message
	@echo "Snake Social Club — available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: frontend-install backend-install ## Install frontend and backend dependencies

frontend-install: ## Install frontend dependencies (npm)
	cd frontend && npm install

backend-install: ## Install backend dependencies (uv)
	cd backend && uv sync

dev: ## Run frontend and backend dev servers together (Ctrl-C stops both)
	@trap 'kill 0' EXIT INT TERM; \
	$(MAKE) backend-dev & \
	$(MAKE) frontend-dev & \
	wait

frontend-dev: ## Run the frontend dev server
	cd frontend && npm run dev

backend-dev: ## Run the backend dev server (uvicorn --reload)
	cd backend && uv run uvicorn app.main:app --reload

test: frontend-test backend-tests ## Run frontend and backend test suites

frontend-test: ## Run frontend tests (vitest)
	cd frontend && npm run test

backend-tests: ## Run backend tests (pytest)
	cd backend && uv run pytest

frontend-lint: ## Lint the frontend
	cd frontend && npm run lint

frontend-format: ## Format the frontend with prettier
	cd frontend && npm run format

frontend-build: ## Build the frontend for production
	cd frontend && npm run build

clean: ## Remove build artifacts and caches
	rm -rf frontend/dist frontend/.output frontend/.vinxi frontend/.nitro
	find backend -type d -name '__pycache__' -exec rm -rf {} +
	rm -rf backend/.pytest_cache
